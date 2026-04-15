import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const cyclesTable = pgTable("cycles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  startDate: text("start_date").notNull(),
  cycleLength: integer("cycle_length").notNull().default(28),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCycleSchema = createInsertSchema(cyclesTable).omit({ id: true, createdAt: true });
export type InsertCycle = z.infer<typeof insertCycleSchema>;
export type Cycle = typeof cyclesTable.$inferSelect;
