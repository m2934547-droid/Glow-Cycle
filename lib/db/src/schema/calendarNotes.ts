import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const calendarNotesTable = pgTable("calendar_notes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  note: text("note").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCalendarNoteSchema = createInsertSchema(calendarNotesTable).omit({ id: true, createdAt: true });
export type InsertCalendarNote = z.infer<typeof insertCalendarNoteSchema>;
export type CalendarNote = typeof calendarNotesTable.$inferSelect;
