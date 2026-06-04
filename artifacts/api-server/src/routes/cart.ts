import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, cartItemsTable, productsTable, ordersTable, orderItemsTable } from "@workspace/db";
import { AddToCartBody, RemoveCartItemParams } from "@workspace/api-zod";
import { requireAuth } from "./users";
import { randomUUID } from "crypto";

const router: IRouter = Router();

async function getUserCart(userId: number) {
  const items = await db
    .select({
      id: cartItemsTable.id,
      productId: cartItemsTable.productId,
      quantity: cartItemsTable.quantity,
      product: productsTable,
    })
    .from(cartItemsTable)
    .innerJoin(productsTable, eq(cartItemsTable.productId, productsTable.id))
    .where(eq(cartItemsTable.userId, userId));

  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const roundedTotal = Math.round(total * 100) / 100;

  return {
    items: items.map(item => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      product: {
        ...item.product,
        imageUrl: item.product.imageUrl ?? undefined,
        createdAt: item.product.createdAt.toISOString(),
      },
    })),
    total: roundedTotal,
  };
}

router.get("/cart", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  res.json(await getUserCart(userId));
});

router.post("/cart", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const parsed = AddToCartBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { productId, quantity } = parsed.data;

  const existing = await db
    .select()
    .from(cartItemsTable)
    .where(and(eq(cartItemsTable.userId, userId), eq(cartItemsTable.productId, productId)));

  if (existing.length > 0) {
    const nextQuantity = existing[0].quantity + quantity;

    if (nextQuantity <= 0) {
      await db
        .delete(cartItemsTable)
        .where(eq(cartItemsTable.id, existing[0].id));
    } else {
      await db
        .update(cartItemsTable)
        .set({ quantity: nextQuantity })
        .where(eq(cartItemsTable.id, existing[0].id));
    }
  } else if (quantity > 0) {
    await db.insert(cartItemsTable).values({ userId, productId, quantity });
  }

  res.json(await getUserCart(userId));
});

router.delete("/cart", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, userId));

  res.json({ message: "Cart cleared" });
});

router.delete("/cart/:itemId", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const params = RemoveCartItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db
    .delete(cartItemsTable)
    .where(and(eq(cartItemsTable.id, params.data.itemId), eq(cartItemsTable.userId, userId)));

  res.json(await getUserCart(userId));
});

router.post("/cart/checkout", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const cart = await getUserCart(userId);
  const total = cart.total;
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const orderId = `GC-${randomUUID().slice(0, 8).toUpperCase()}`;

  const [order] = await db.insert(ordersTable).values({ userId, orderId, total, itemCount }).returning();

  if (cart.items.length > 0) {
    await db.insert(orderItemsTable).values(
      cart.items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        productName: item.product.name,
        productCategory: item.product.category,
        price: item.product.price,
        quantity: item.quantity,
      }))
    );
  }

  await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, userId));

  res.json({
    orderId,
    message: "Order placed successfully! Your period care is on the way.",
    total,
    itemCount,
  });
});

export default router;
