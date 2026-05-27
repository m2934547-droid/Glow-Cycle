import bcrypt from "bcryptjs";
import { and, desc, eq, gt, gte, isNull, sql } from "drizzle-orm";
import { db, passwordResetOtpsTable } from "@workspace/db";
import { logger } from "./logger";

export type OtpType = "signup_verification" | "password_reset";

const OTP_LENGTH = 6;
const MAX_ATTEMPTS = 5;
const MAX_REQUESTS_PER_HOUR = 5;

function getOtpExpiryMinutes(): number {
  const raw = Number(process.env.OTP_EXPIRE_MINUTES ?? "5");
  if (Number.isNaN(raw) || raw <= 0) return 5;
  return raw;
}

function getCooldownSeconds(): number {
  const raw = Number(process.env.OTP_RESEND_COOLDOWN_SECONDS ?? "60");
  if (Number.isNaN(raw) || raw < 0) return 60;
  return raw;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function maskEmail(email: string): string {
  const [name = "", domain = ""] = email.split("@");
  const visible = name.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(1, name.length - visible.length))}@${domain}`;
}

function generateOtpCode(): string {
  return Math.floor(10 ** (OTP_LENGTH - 1) + Math.random() * 9 * 10 ** (OTP_LENGTH - 1)).toString();
}

export class OtpError extends Error {
  code: "RATE_LIMITED" | "COOLDOWN" | "INVALID";
  waitSeconds?: number;

  constructor(code: OtpError["code"], message: string, waitSeconds?: number) {
    super(message);
    this.code = code;
    this.waitSeconds = waitSeconds;
  }
}

export async function issueOtp(params: {
  email: string;
  type: OtpType;
}): Promise<{ otp: string; expiresAt: Date; cooldownSeconds: number }> {
  const email = normalizeEmail(params.email);
  const now = new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const [requestCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(passwordResetOtpsTable)
    .where(
      and(
        eq(passwordResetOtpsTable.email, email),
        eq(passwordResetOtpsTable.otpType, params.type),
        gte(passwordResetOtpsTable.createdAt, hourAgo),
      ),
    );

  if ((requestCount?.count ?? 0) >= MAX_REQUESTS_PER_HOUR) {
    throw new OtpError("RATE_LIMITED", "Too many OTP requests. Please try again later.");
  }

  const [latest] = await db
    .select()
    .from(passwordResetOtpsTable)
    .where(
      and(
        eq(passwordResetOtpsTable.email, email),
        eq(passwordResetOtpsTable.otpType, params.type),
        isNull(passwordResetOtpsTable.usedAt),
        gt(passwordResetOtpsTable.expiresAt, now),
      ),
    )
    .orderBy(desc(passwordResetOtpsTable.createdAt))
    .limit(1);

  if (latest && latest.resendAvailableAt > now) {
    const waitSeconds = Math.ceil((latest.resendAvailableAt.getTime() - now.getTime()) / 1000);
    throw new OtpError("COOLDOWN", "Please wait before requesting a new OTP.", Math.max(waitSeconds, 1));
  }

  const otp = generateOtpCode();
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(now.getTime() + getOtpExpiryMinutes() * 60 * 1000);
  const cooldownSeconds = getCooldownSeconds();
  const resendAvailableAt = new Date(now.getTime() + cooldownSeconds * 1000);

  await db.insert(passwordResetOtpsTable).values({
    email,
    otpHash,
    otpType: params.type,
    expiresAt,
    attempts: 0,
    resendAvailableAt,
  });

  logger.info({ email: maskEmail(email), type: params.type }, "OTP issued");
  return { otp, expiresAt, cooldownSeconds };
}

export async function verifyOtp(params: {
  email: string;
  otp: string;
  type: OtpType;
}): Promise<boolean> {
  const email = normalizeEmail(params.email);
  const now = new Date();

  const [record] = await db
    .select()
    .from(passwordResetOtpsTable)
    .where(
      and(
        eq(passwordResetOtpsTable.email, email),
        eq(passwordResetOtpsTable.otpType, params.type),
        isNull(passwordResetOtpsTable.usedAt),
      ),
    )
    .orderBy(desc(passwordResetOtpsTable.createdAt))
    .limit(1);

  if (!record) return false;
  if (record.expiresAt <= now) return false;
  if (record.attempts >= MAX_ATTEMPTS) return false;

  const matched = await bcrypt.compare(params.otp, record.otpHash);

  if (!matched) {
    await db
      .update(passwordResetOtpsTable)
      .set({ attempts: record.attempts + 1 })
      .where(eq(passwordResetOtpsTable.id, record.id));
    return false;
  }

  await db
    .update(passwordResetOtpsTable)
    .set({ usedAt: now })
    .where(eq(passwordResetOtpsTable.id, record.id));

  return true;
}
