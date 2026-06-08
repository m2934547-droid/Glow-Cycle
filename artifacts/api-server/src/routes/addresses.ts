import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, addressesTable } from "@workspace/db";
import { AddressBody, AddressParams } from "@workspace/api-zod";
import { requireAuth } from "./users";

const router: IRouter = Router();

function formatAddress(address: typeof addressesTable.$inferSelect) {
  return {
    id: address.id,
    userId: address.userId,
    address: address.address,
    latitude: address.latitude,
    longitude: address.longitude,
    city: address.city,
    state: address.state,
    country: address.country,
    postalCode: address.postalCode,
    createdAt: address.createdAt.toISOString(),
    updatedAt: address.updatedAt.toISOString(),
  };
}

router.get("/addresses", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const rows = await db
    .select()
    .from(addressesTable)
    .where(eq(addressesTable.userId, userId))
    .orderBy(desc(addressesTable.createdAt));

  res.json(rows.map(formatAddress));
});

router.post("/addresses", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const parsed = AddressBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db.insert(addressesTable).values({
    userId,
    ...parsed.data,
  }).returning();

  if (!row) {
    res.status(500).json({ error: "Failed to create address" });
    return;
  }

  res.status(201).json(formatAddress(row));
});

router.put("/addresses/:addressId", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const params = AddressParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = AddressBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(addressesTable)
    .where(eq(addressesTable.id, params.data.addressId));

  if (!existing || existing.userId !== userId) {
    res.status(404).json({ error: "Address not found" });
    return;
  }

  const [row] = await db
    .update(addressesTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(addressesTable.id, params.data.addressId))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Address not found" });
    return;
  }

  res.json(formatAddress(row));
});

router.delete("/addresses/:addressId", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const params = AddressParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(addressesTable)
    .where(eq(addressesTable.id, params.data.addressId));

  if (!existing || existing.userId !== userId) {
    res.status(404).json({ error: "Address not found" });
    return;
  }

  await db.delete(addressesTable).where(eq(addressesTable.id, params.data.addressId));
  res.json({ message: "Address deleted" });
});

export default router;
