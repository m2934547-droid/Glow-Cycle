import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, consultantsTable, usersTable } from "@workspace/db";
import {
  AddConsultantBody,
  UpdateConsultantBody,
  UpdateConsultantParams,
  DeleteConsultantParams,
} from "@workspace/api-zod";
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

function serialize(c: typeof consultantsTable.$inferSelect) {
  return {
    id: c.id,
    name: c.name,
    designation: c.designation,
    phone: c.phone,
    consultancyFee: c.consultancyFee,
    medicineFee: c.medicineFee,
    createdAt: c.createdAt.toISOString(),
  };
}

router.get("/consultants", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const rows = await db
    .select()
    .from(consultantsTable)
    .orderBy(desc(consultantsTable.createdAt));

  res.json(rows.map(serialize));
});

router.post("/consultants", async (req, res): Promise<void> => {
  const isAdmin = await requireAdmin(req, res);
  if (!isAdmin) return;

  const parsed = AddConsultantBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [created] = await db.insert(consultantsTable).values({
    name: parsed.data.name,
    designation: parsed.data.designation,
    phone: parsed.data.phone,
    consultancyFee: parsed.data.consultancyFee ?? 0,
    medicineFee: parsed.data.medicineFee ?? 0,
  }).returning();

  res.status(201).json(serialize(created));
});

router.put("/consultants/:consultantId", async (req, res): Promise<void> => {
  const isAdmin = await requireAdmin(req, res);
  if (!isAdmin) return;

  const params = UpdateConsultantParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateConsultantBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db.update(consultantsTable)
    .set(parsed.data)
    .where(eq(consultantsTable.id, params.data.consultantId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Consultant not found" });
    return;
  }

  res.json(serialize(updated));
});

router.delete("/consultants/:consultantId", async (req, res): Promise<void> => {
  const isAdmin = await requireAdmin(req, res);
  if (!isAdmin) return;

  const params = DeleteConsultantParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(consultantsTable)
    .where(eq(consultantsTable.id, params.data.consultantId));

  res.json({ message: "Consultant removed" });
});

export default router;
