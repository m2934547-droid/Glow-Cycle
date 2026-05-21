import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";

export const passwordResetOtpsTable = pgTable("password_reset_otps", {
  id: serial("id").primaryKey(),
  email: text("email"),
  phone: text("phone"),
  otp: text("otp").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
