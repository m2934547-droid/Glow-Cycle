import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";

export const passwordResetOtpsTable = pgTable("password_reset_otps", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  otpHash: text("otp_hash").notNull(),
  otpType: text("otp_type").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  attempts: integer("attempts").notNull().default(0),
  resendAvailableAt: timestamp("resend_available_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
