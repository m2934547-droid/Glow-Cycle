import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, partnersTable, usersTable, cyclesTable } from "@workspace/db";
import { AddPartnerBody, RemovePartnerParams } from "@workspace/api-zod";
import { requireAuth } from "./users";

const router: IRouter = Router();

function computePhase(startDate: string, cycleLength: number) {
  const start = new Date(startDate);
  const today = new Date();
  const msPerDay = 86400000;
  const daysSinceStart = Math.floor((today.getTime() - start.getTime()) / msPerDay);
  const cycleDay = (daysSinceStart % cycleLength) + 1;
  const daysUntilNextPeriod = cycleLength - (daysSinceStart % cycleLength);
  const nextPeriodDate = new Date(today.getTime() + daysUntilNextPeriod * msPerDay);

  let currentPhase: string;
  if (cycleDay <= 5) currentPhase = "menstrual";
  else if (cycleDay <= 13) currentPhase = "follicular";
  else if (cycleDay <= 16) currentPhase = "ovulation";
  else currentPhase = "luteal";

  return {
    currentPhase,
    cycleDay,
    daysUntilNextPeriod,
    nextPeriodDate: nextPeriodDate.toISOString().split("T")[0],
  };
}

function buildMessage(name: string, phase: string, cycleDay: number, daysUntilNextPeriod: number) {
  switch (phase) {
    case "menstrual":
      return `${name} is on day ${cycleDay} of her menstrual phase. Be extra supportive — offer warmth, comfort, and patience. Cramps and mood swings are common.`;
    case "follicular":
      return `${name} is in her follicular phase (day ${cycleDay}). Energy and mood are typically rising — a great time for plans and shared activities.`;
    case "ovulation":
      return `${name} is in her ovulation phase (day ${cycleDay}). She may feel her most energetic and confident.`;
    case "luteal":
      return `${name} is in her luteal phase (day ${cycleDay}), with about ${daysUntilNextPeriod} day${daysUntilNextPeriod === 1 ? "" : "s"} until her next period. PMS symptoms may appear — be understanding and gentle.`;
    default:
      return `${name} is on day ${cycleDay} of her cycle.`;
  }
}

router.get("/partners", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const partners = await db
    .select()
    .from(partnersTable)
    .where(eq(partnersTable.ownerUserId, userId))
    .orderBy(desc(partnersTable.createdAt));

  res.json(partners.map(p => ({
    id: p.id,
    partnerName: p.partnerName,
    partnerEmail: p.partnerEmail,
    relationship: p.relationship,
    createdAt: p.createdAt.toISOString(),
  })));
});

router.post("/partners", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const parsed = AddPartnerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [created] = await db.insert(partnersTable).values({
    ownerUserId: userId,
    partnerName: parsed.data.partnerName,
    partnerEmail: parsed.data.partnerEmail.toLowerCase().trim(),
    relationship: parsed.data.relationship ?? "partner",
  }).returning();

  res.status(201).json({
    id: created.id,
    partnerName: created.partnerName,
    partnerEmail: created.partnerEmail,
    relationship: created.relationship,
    createdAt: created.createdAt.toISOString(),
  });
});

router.delete("/partners/:partnerId", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const params = RemovePartnerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(partnersTable)
    .where(eq(partnersTable.id, params.data.partnerId));

  res.json({ message: "Partner removed" });
});

router.get("/partners/shared-with-me", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const [me] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!me) {
    res.json([]);
    return;
  }

  const myEmail = me.email.toLowerCase().trim();

  const sharedPartners = await db
    .select()
    .from(partnersTable)
    .where(eq(partnersTable.partnerEmail, myEmail));

  const notifications = [];
  for (const p of sharedPartners) {
    const [owner] = await db.select().from(usersTable).where(eq(usersTable.id, p.ownerUserId));
    if (!owner) continue;

    const [latest] = await db
      .select()
      .from(cyclesTable)
      .where(eq(cyclesTable.userId, owner.id))
      .orderBy(desc(cyclesTable.startDate))
      .limit(1);

    const today = new Date().toISOString().split("T")[0];
    const phase = computePhase(latest?.startDate ?? today, latest?.cycleLength ?? 28);

    notifications.push({
      ownerName: owner.name,
      ownerEmail: owner.email,
      relationship: p.relationship,
      currentPhase: phase.currentPhase,
      cycleDay: phase.cycleDay,
      daysUntilNextPeriod: phase.daysUntilNextPeriod,
      nextPeriodDate: phase.nextPeriodDate,
      message: buildMessage(owner.name, phase.currentPhase, phase.cycleDay, phase.daysUntilNextPeriod),
    });
  }

  res.json(notifications);
});

export default router;
