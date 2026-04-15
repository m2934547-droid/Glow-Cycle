import { Router, type IRouter } from "express";
import { eq, count } from "drizzle-orm";
import { db, usersTable, cyclesTable, productsTable } from "@workspace/db";
import { AdminDeleteUserParams } from "@workspace/api-zod";
import { requireAuth } from "./users";
import { formatUser } from "./auth";

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

  const [userCount] = await db.select({ count: count() }).from(usersTable);
  const [cycleCount] = await db.select({ count: count() }).from(cyclesTable);
  const [productCount] = await db.select({ count: count() }).from(productsTable);

  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const allUsers = await db.select().from(usersTable);
  const activeThisMonth = allUsers.filter(u => u.createdAt >= oneMonthAgo).length;

  res.json({
    totalUsers: Number(userCount.count),
    totalCycles: Number(cycleCount.count),
    totalProducts: Number(productCount.count),
    activeUsersThisMonth: activeThisMonth,
  });
});

export default router;
