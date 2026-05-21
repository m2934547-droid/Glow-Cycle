import { Router, type IRouter } from "express";
import { eq, lt } from "drizzle-orm";
import { db, usersTable, passwordResetOtpsTable } from "@workspace/db";
import { SignupBody, LoginBody, ForgotPasswordBody, ResetPasswordBody } from "@workspace/api-zod";
import { createHash } from "crypto";

const router: IRouter = Router();

function hashPassword(password: string): string {
  return createHash("sha256").update(password + "glowcycle_salt").digest("hex");
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
    age: user.age,
    heightCm: user.heightCm,
    weightKg: user.weightKg,
    bmi,
    bmiCategory: getBmiCategory(bmi),
    isAdmin: user.isAdmin,
    createdAt: user.createdAt.toISOString(),
  };
}

router.post("/auth/signup", async (req, res): Promise<void> => {
  const parsed = SignupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, email, password, age, heightCm, weightKg } = parsed.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const [user] = await db.insert(usersTable).values({
    name,
    email,
    passwordHash: hashPassword(password),
    age,
    heightCm,
    weightKg,
    isAdmin: false,
  }).returning();

  (req.session as Record<string, unknown>).userId = user.id;

  res.status(201).json({ user: formatUser(user), message: "Account created successfully" });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user || user.passwordHash !== hashPassword(password)) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  (req.session as Record<string, unknown>).userId = user.id;

  res.json({ user: formatUser(user), message: "Logged in successfully" });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  req.session.destroy(() => {
    res.json({ message: "Logged out successfully" });
  });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const userId = (req.session as Record<string, unknown>).userId as number | undefined;
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
  const parsed = ForgotPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim()));

  if (!user) {
    res.json({ message: "If that email is registered, an OTP has been sent.", otp: "" });
    return;
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await db.insert(passwordResetOtpsTable).values({ email: email.toLowerCase().trim(), otp, expiresAt });

  res.json({ message: "OTP sent to your email address.", otp });
});

router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const parsed = ResetPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, otp, newPassword } = parsed.data;
  const now = new Date();

  const [record] = await db
    .select()
    .from(passwordResetOtpsTable)
    .where(eq(passwordResetOtpsTable.email, email.toLowerCase().trim()));

  if (!record || record.used || record.otp !== otp || record.expiresAt < now) {
    res.status(400).json({ error: "Invalid or expired OTP. Please request a new one." });
    return;
  }

  await db
    .update(passwordResetOtpsTable)
    .set({ used: true })
    .where(eq(passwordResetOtpsTable.id, record.id));

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim()));
  if (!user) {
    res.status(400).json({ error: "User not found." });
    return;
  }

  await db
    .update(usersTable)
    .set({ passwordHash: hashPassword(newPassword) })
    .where(eq(usersTable.id, user.id));

  res.json({ message: "Password reset successfully. You can now log in." });
});

export { formatUser, computeBmi, getBmiCategory };
export default router;
