import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { requireAuth } from "../routes/users";

export async function requireAdmin(req: any, res: any): Promise<number | null> {
  const userId = requireAuth(req, res);
  if (!userId) return null;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user || !user.isAdmin) {
    res.status(403).json({ error: "Admin access required" });
    return null;
  }

  return userId;
}
