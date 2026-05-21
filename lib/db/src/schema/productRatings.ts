import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { productsTable } from "./products";

export const productRatingsTable = pgTable("product_ratings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  review: text("review"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProductRatingSchema = createInsertSchema(productRatingsTable).omit({ id: true, createdAt: true });
export type InsertProductRating = z.infer<typeof insertProductRatingSchema>;
export type ProductRating = typeof productRatingsTable.$inferSelect;
