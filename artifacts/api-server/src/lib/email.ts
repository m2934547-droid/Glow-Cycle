import nodemailer from "nodemailer";
import { logger } from "./logger";

function getTransporter() {
  const user = process.env.SMTP_EMAIL;
  const pass = process.env.SMTP_PASSWORD;

  if (!user || !pass) return null;

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

export async function sendOtpEmail(params: {
  to: string;
  otp: string;
  flowLabel: string;
  expireMinutes: number;
}): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SMTP_EMAIL and SMTP_PASSWORD must be configured in production.");
    }

    logger.warn(
      { to: params.to, otp: params.otp, flow: params.flowLabel },
      "SMTP is not configured. OTP email skipped and OTP logged for local development.",
    );
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_EMAIL,
    to: params.to,
    subject: `GlowCycle ${params.flowLabel} OTP`,
    text: `Your GlowCycle OTP is ${params.otp}. It expires in ${params.expireMinutes} minutes.`,
    html: `<p>Your GlowCycle OTP is <b>${params.otp}</b>.</p><p>It expires in ${params.expireMinutes} minutes.</p>`,
  });
}
