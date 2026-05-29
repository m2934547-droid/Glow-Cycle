import { logger } from "./logger";

const EMAILJS_SEND_URL = "https://api.emailjs.com/api/v1.0/email/send";

function readEnv(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key];
    if (value?.trim()) return value.trim();
  }

  return undefined;
}

function getEmailJsConfig() {
  const serviceId = readEnv("EMAILJS_SERVICE_ID", "EMAILJS_service_id");
  const templateId = readEnv("EMAILJS_TEMPLATE_ID", "EMAILJS_template_id");
  const publicKey = readEnv("EMAILJS_PUBLIC_KEY", "EMAILJS_USER_ID", "EMAILJS_public_key");
  const privateKey = readEnv("EMAILJS_PRIVATE_KEY", "EMAILJS_ACCESS_TOKEN", "EMAILJS_private_key");

  if (!serviceId || !templateId || !publicKey) return null;

  return { serviceId, templateId, publicKey, privateKey };
}

export async function sendOtpEmail(params: {
  to: string;
  otp: string;
  flowLabel: string;
  expireMinutes: number;
}): Promise<void> {
  const config = getEmailJsConfig();

  if (!config) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, and EMAILJS_PUBLIC_KEY must be configured in production.",
      );
    }

    logger.warn(
      { to: params.to, otp: params.otp, flow: params.flowLabel },
      "EmailJS is not configured. OTP email skipped and OTP logged for local development.",
    );
    return;
  }

  const response = await fetch(EMAILJS_SEND_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: config.serviceId,
      template_id: config.templateId,
      user_id: config.publicKey,
      accessToken: config.privateKey,
      template_params: {
        to_email: params.to,
        email: params.to,
        user_email: params.to,
        otp: params.otp,
        code: params.otp,
        passcode: params.otp,
        flow_label: params.flowLabel,
        expire_minutes: params.expireMinutes,
      },
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    logger.error(
      { status: response.status, body: message },
      "EmailJS OTP email request failed",
    );
    throw new Error("Could not send OTP email.");
  }
}
