import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, ordersTable, orderItemsTable } from "@workspace/db";
import { requireAuth } from "./users";

const router: IRouter = Router();

router.get("/orders", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.userId, userId))
    .orderBy(desc(ordersTable.createdAt));

  const result = await Promise.all(
    orders.map(async (order) => {
      const items = await db
        .select()
        .from(orderItemsTable)
        .where(eq(orderItemsTable.orderId, order.id));

      return {
        id: order.id,
        orderId: order.orderId,
        total: order.total,
        itemCount: order.itemCount,
        createdAt: order.createdAt.toISOString(),
        items: items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          productCategory: item.productCategory,
          price: item.price,
          quantity: item.quantity,
        })),
      };
    })
  );

  res.json(result);
});

export default router;
