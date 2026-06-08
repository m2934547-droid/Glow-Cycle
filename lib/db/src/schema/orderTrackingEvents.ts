import { pgTable, serial, text, timestamp, integer, real, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { ordersTable } from "./orders";

export const orderTrackingEventsTable = pgTable(
  "order_tracking_events",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id").notNull().references(() => ordersTable.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    latitude: real("latitude").notNull(),
    longitude: real("longitude").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    orderIdIdx: index("order_tracking_events_order_id_idx").on(table.orderId),
  }),
);

export const insertOrderTrackingEventSchema = createInsertSchema(orderTrackingEventsTable).omit({ id: true, createdAt: true });
export type InsertOrderTrackingEvent = z.infer<typeof insertOrderTrackingEventSchema>;
export type OrderTrackingEvent = typeof orderTrackingEventsTable.$inferSelect;
