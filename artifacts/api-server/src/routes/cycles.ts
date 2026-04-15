import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, cyclesTable } from "@workspace/db";
import { CreateCycleBody, DeleteCycleParams } from "@workspace/api-zod";
import { requireAuth } from "./users";

const router: IRouter = Router();

function computePrediction(startDate: string, cycleLength: number) {
  const start = new Date(startDate);
  const today = new Date();

  const msPerDay = 86400000;
  const daysSinceStart = Math.floor((today.getTime() - start.getTime()) / msPerDay);
  const cycleDay = (daysSinceStart % cycleLength) + 1;

  const daysUntilNextPeriod = cycleLength - (daysSinceStart % cycleLength);
  const nextPeriodDate = new Date(today.getTime() + daysUntilNextPeriod * msPerDay);

  const ovulationDay = cycleLength - 14;
  const ovulationDate = new Date(start.getTime());
  let daysToOvulation = ovulationDay - (daysSinceStart % cycleLength);
  if (daysToOvulation <= 0) daysToOvulation += cycleLength;
  ovulationDate.setTime(today.getTime() + daysToOvulation * msPerDay);

  const fertileStart = new Date(ovulationDate.getTime() - 5 * msPerDay);
  const fertileEnd = new Date(ovulationDate.getTime() + 1 * msPerDay);

  let currentPhase: string;
  if (cycleDay <= 5) currentPhase = "menstrual";
  else if (cycleDay <= 13) currentPhase = "follicular";
  else if (cycleDay <= 16) currentPhase = "ovulation";
  else currentPhase = "luteal";

  return {
    lastPeriodStart: startDate,
    nextPeriodDate: nextPeriodDate.toISOString().split("T")[0],
    ovulationDate: ovulationDate.toISOString().split("T")[0],
    fertileWindowStart: fertileStart.toISOString().split("T")[0],
    fertileWindowEnd: fertileEnd.toISOString().split("T")[0],
    currentPhase,
    cycleDay,
    cycleLength,
    daysUntilNextPeriod,
  };
}

router.get("/cycles", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const cycles = await db
    .select()
    .from(cyclesTable)
    .where(eq(cyclesTable.userId, userId))
    .orderBy(desc(cyclesTable.startDate));

  res.json(cycles.map(c => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
  })));
});

router.post("/cycles", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const parsed = CreateCycleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [cycle] = await db.insert(cyclesTable).values({
    userId,
    startDate: parsed.data.startDate,
    cycleLength: parsed.data.cycleLength ?? 28,
    notes: parsed.data.notes ?? null,
  }).returning();

  res.status(201).json({ ...cycle, createdAt: cycle.createdAt.toISOString() });
});

router.get("/cycles/current", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const [latest] = await db
    .select()
    .from(cyclesTable)
    .where(eq(cyclesTable.userId, userId))
    .orderBy(desc(cyclesTable.startDate))
    .limit(1);

  if (!latest) {
    const today = new Date().toISOString().split("T")[0];
    res.json(computePrediction(today, 28));
    return;
  }

  res.json(computePrediction(latest.startDate, latest.cycleLength));
});

router.delete("/cycles/:cycleId", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const params = DeleteCycleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(cyclesTable)
    .where(eq(cyclesTable.id, params.data.cycleId))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Cycle not found" });
    return;
  }

  res.json({ message: "Cycle deleted" });
});

export default router;
