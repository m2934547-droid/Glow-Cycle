import { Router, type IRouter, type Request } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, usersTable } from "@workspace/db";
import { LoginBody, SignupBody } from "@workspace/api-zod";
import { EmailDeliveryError, sendOtpEmail } from "../lib/email";
import { issueOtp, maskEmail, normalizeEmail, OtpError, verifyOtp } from "../lib/otp";
import { hashPassword, verifyPassword } from "../lib/password";
import { logger } from "../lib/logger";

const router: IRouter = Router();
const RESET_SESSION_KEY = "passwordResetVerifiedEmail";

const signupRequestSchema = SignupBody;
const otpEmailSchema = z.object({ email: z.string().email() });
const signupVerifySchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});
const forgotPasswordSchema = otpEmailSchema;
const forgotPasswordVerifySchema = signupVerifySchema;
const resetPasswordSchema = z.object({
  email: z.string().email(),
  newPassword: z.string().min(6),
});
const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
});

function sessionData(req: Request) {
  return req.session as unknown as Record<string, unknown>;
}

function computeBmi(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

function getBmiCategory(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

function formatUser(user: typeof usersTable.$inferSelect) {
  const bmi = computeBmi(user.weightKg, user.heightCm);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber ?? undefined,
    age: user.age,
    heightCm: user.heightCm,
    weightKg: user.weightKg,
    bmi,
    bmiCategory: getBmiCategory(bmi),
    isAdmin: user.isAdmin,
    createdAt: user.createdAt.toISOString(),
  };
}

function otpExpireMinutes(): number {
  const raw = Number(process.env.OTP_EXPIRE_MINUTES ?? "5");
  return Number.isNaN(raw) || raw <= 0 ? 5 : raw;
}

router.post("/auth/signup", async (req, res): Promise<void> => {
  const parsed = signupRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const body = parsed.data;
  const email = normalizeEmail(body.email);

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing?.isVerified) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await hashPassword(body.password);

  if (!existing) {
    await db.insert(usersTable).values({
      name: body.name.trim(),
      email,
      passwordHash,
      age: body.age,
      heightCm: body.heightCm,
      weightKg: body.weightKg,
      phoneNumber: body.phoneNumber?.trim() || null,
      isAdmin: false,
      isVerified: false,
    });
  } else {
    await db
      .update(usersTable)
      .set({
        name: body.name.trim(),
        passwordHash,
        age: body.age,
        heightCm: body.heightCm,
        weightKg: body.weightKg,
        phoneNumber: body.phoneNumber?.trim() || null,
      })
      .where(eq(usersTable.id, existing.id));
  }

  try {
    const { otp } = await issueOtp({ email, type: "signup_verification" });
    await sendOtpEmail({
      to: email,
      otp,
      flowLabel: "Signup Verification",
      expireMinutes: otpExpireMinutes(),
    });
  } catch (error) {
    if (error instanceof OtpError) {
      const message =
        error.code === "COOLDOWN"
          ? `Please wait ${error.waitSeconds ?? 60}s before requesting another OTP.`
          : error.message;
      res.status(429).json({ error: message });
      return;
    }
    logger.error({ err: error, email: maskEmail(email) }, "Failed to issue signup OTP");
    res.status(500).json({
      error:
        error instanceof EmailDeliveryError && process.env.NODE_ENV !== "production"
          ? error.message
          : "Could not send OTP right now. Please try again.",
    });
    return;
  }

  res.status(200).json({ message: "OTP sent to your email. Please verify to complete signup." });
});

router.post("/auth/signup/resend-otp", async (req, res): Promise<void> => {
  const parsed = otpEmailSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const email = normalizeEmail(parsed.data.email);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user || user.isVerified) {
    res.status(400).json({ error: "No pending signup found for this email." });
    return;
  }

  try {
    const { otp } = await issueOtp({ email, type: "signup_verification" });
    await sendOtpEmail({
      to: email,
      otp,
      flowLabel: "Signup Verification",
      expireMinutes: otpExpireMinutes(),
    });
  } catch (error) {
    if (error instanceof OtpError) {
      const message =
        error.code === "COOLDOWN"
          ? `Please wait ${error.waitSeconds ?? 60}s before requesting another OTP.`
          : error.message;
      res.status(429).json({ error: message });
      return;
    }
    res.status(500).json({
      error:
        error instanceof EmailDeliveryError && process.env.NODE_ENV !== "production"
          ? error.message
          : "Could not resend OTP right now.",
    });
    return;
  }

  res.json({ message: "OTP resent to your email." });
});

router.post("/auth/signup/verify", async (req, res): Promise<void> => {
  const parsed = signupVerifySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const email = normalizeEmail(parsed.data.email);
  const valid = await verifyOtp({ email, otp: parsed.data.otp, type: "signup_verification" });
  if (!valid) {
    res.status(400).json({ error: "Invalid or expired OTP." });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    res.status(400).json({ error: "Signup session expired. Please sign up again." });
    return;
  }

  await db.update(usersTable).set({ isVerified: true }).where(eq(usersTable.id, user.id));
  sessionData(req).userId = user.id;

  const [verifiedUser] = await db.select().from(usersTable).where(eq(usersTable.id, user.id));
  res.json({ user: formatUser(verifiedUser), message: "Email verified and account activated." });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const email = normalizeEmail(parsed.data.email);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  if (!user.isVerified) {
    res.status(403).json({ error: "Please verify your email before logging in." });
    return;
  }

  sessionData(req).userId = user.id;
  res.json({ user: formatUser(user), message: "Logged in successfully" });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  req.session.destroy(() => {
    res.json({ message: "Logged out successfully" });
  });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const userId = sessionData(req).userId as number | undefined;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  res.json(formatUser(user));
});

router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const email = normalizeEmail(parsed.data.email);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));

  if (user?.isVerified) {
    try {
      const { otp } = await issueOtp({ email, type: "password_reset" });
      await sendOtpEmail({
        to: email,
        otp,
        flowLabel: "Password Reset",
        expireMinutes: otpExpireMinutes(),
      });
    } catch (error) {
      if (!(error instanceof OtpError)) {
        logger.error({ err: error, email: maskEmail(email) }, "Forgot-password OTP issue failed");
      }
    }
  }

  res.json({ message: "If this email is registered, an OTP has been sent." });
});

router.post("/auth/forgot-password/verify", async (req, res): Promise<void> => {
  const parsed = forgotPasswordVerifySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const email = normalizeEmail(parsed.data.email);
  const valid = await verifyOtp({ email, otp: parsed.data.otp, type: "password_reset" });
  if (!valid) {
    res.status(400).json({ error: "Invalid or expired OTP." });
    return;
  }

  sessionData(req)[RESET_SESSION_KEY] = email;
  res.json({ message: "OTP verified. You can now reset your password.", verified: true });
});

router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const email = normalizeEmail(parsed.data.email);
  const sessionEmail = sessionData(req)[RESET_SESSION_KEY];
  if (sessionEmail !== email) {
    res.status(403).json({ error: "Password reset not authorized. Verify OTP first." });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    res.status(400).json({ error: "Unable to reset password." });
    return;
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, user.id));
  delete sessionData(req)[RESET_SESSION_KEY];

  res.json({ message: "Password reset successfully. You can now log in." });
});

router.post("/auth/change-password", async (req, res): Promise<void> => {
  const userId = sessionData(req).userId as number | undefined;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  const matches = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!matches) {
    res.status(400).json({ error: "Current password is incorrect." });
    return;
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, user.id));

  res.json({ message: "Password updated successfully." });
});

export { formatUser, computeBmi, getBmiCategory };
export default router;
