import { Router, type IRouter } from "express";
import { eq, count, gte, sql } from "drizzle-orm";
import { db, usersTable, cyclesTable, productsTable, ordersTable } from "@workspace/db";
import { AdminDeleteUserParams } from "@workspace/api-zod";
import { requireAuth } from "./users";

const router: IRouter = Router();

async function requireAdmin(req: any, res: any): Promise<boolean> {
  const userId = requireAuth(req, res);
  if (!userId) return false;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user || !user.isAdmin) {
    res.status(403).json({ error: "Admin access required" });
    return false;
  }
  return true;
}

router.get("/admin/users", async (req, res): Promise<void> => {
  const isAdmin = await requireAdmin(req, res);
  if (!isAdmin) return;

  const users = await db.select().from(usersTable);
  const cycleCounts = await db
    .select({ userId: cyclesTable.userId, count: count() })
    .from(cyclesTable)
    .groupBy(cyclesTable.userId);

  const countMap = new Map(cycleCounts.map(c => [c.userId, Number(c.count)]));

  res.json(users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    age: u.age,
    isAdmin: u.isAdmin,
    cycleCount: countMap.get(u.id) ?? 0,
    createdAt: u.createdAt.toISOString(),
  })));
});

router.delete("/admin/users/:userId", async (req, res): Promise<void> => {
  const isAdmin = await requireAdmin(req, res);
  if (!isAdmin) return;

  const params = AdminDeleteUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(usersTable).where(eq(usersTable.id, params.data.userId));

  res.json({ message: "User deleted" });
});

router.get("/admin/stats", async (req, res): Promise<void> => {
  const isAdmin = await requireAdmin(req, res);
  if (!isAdmin) return;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [userCount] = await db.select({ count: count() }).from(usersTable);
  const [cycleCount] = await db.select({ count: count() }).from(cyclesTable);
  const [productCount] = await db.select({ count: count() }).from(productsTable);

  // New users in last 30 days
  const [newUsersResult] = await db
    .select({ count: count() })
    .from(usersTable)
    .where(gte(usersTable.createdAt, thirtyDaysAgo));

  // Orders in last 30 days
  const [ordersResult] = await db
    .select({ count: count() })
    .from(ordersTable)
    .where(gte(ordersTable.createdAt, thirtyDaysAgo));

  // Revenue in last 30 days
  const revenueResult = await db
    .select({ total: sql<number>`COALESCE(SUM(total), 0)` })
    .from(ordersTable)
    .where(gte(ordersTable.createdAt, thirtyDaysAgo));

  // Total items ordered in last 30 days
  const itemsResult = await db
    .select({ total: sql<number>`COALESCE(SUM(item_count), 0)` })
    .from(ordersTable)
    .where(gte(ordersTable.createdAt, thirtyDaysAgo));

  res.json({
    totalUsers: Number(userCount.count),
    totalCycles: Number(cycleCount.count),
    totalProducts: Number(productCount.count),
    activeUsersThisMonth: Number(newUsersResult.count),
    ordersLast30Days: Number(ordersResult.count),
    revenueLastl30Days: Math.round(Number(revenueResult[0]?.total ?? 0)),
    itemsOrderedLast30Days: Number(itemsResult[0]?.total ?? 0),
  });
});

export default router;
