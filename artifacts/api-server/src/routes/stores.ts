import { Router, type IRouter } from "express";
import { db, storesTable } from "@workspace/db";
import { GetStoresResponse, NearestStoreQuery, NearestStoreResponse } from "@workspace/api-zod";

const router: IRouter = Router();

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const r = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function deliveryZone(distanceKm: number): string {
  if (distanceKm <= 5) return "Same-day delivery";
  if (distanceKm <= 25) return "Next-day delivery";
  if (distanceKm <= 75) return "Standard delivery";
  return "Extended delivery zone";
}

router.get("/stores", async (_req, res): Promise<void> => {
  const stores = await db.select().from(storesTable);
  res.json(
    GetStoresResponse.parse(
      stores.map((store) => ({
        id: store.id,
        name: store.name,
        address: store.address,
        latitude: store.latitude,
        longitude: store.longitude,
        createdAt: store.createdAt.toISOString(),
      })),
    ),
  );
});

router.get("/stores/nearest", async (req, res): Promise<void> => {
  const parsed = NearestStoreQuery.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const stores = await db.select().from(storesTable);
  if (stores.length === 0) {
    res.status(404).json({ error: "No stores found" });
    return;
  }

  const nearest = stores
    .map((store) => ({
      store,
      distanceKm: haversineKm(parsed.data.latitude, parsed.data.longitude, store.latitude, store.longitude),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)[0];

  res.json(
    NearestStoreResponse.parse({
      store: {
        id: nearest.store.id,
        name: nearest.store.name,
        address: nearest.store.address,
        latitude: nearest.store.latitude,
        longitude: nearest.store.longitude,
        createdAt: nearest.store.createdAt.toISOString(),
      },
      distanceKm: Math.round(nearest.distanceKm * 100) / 100,
      deliveryZone: deliveryZone(nearest.distanceKm),
    }),
  );
});

export default router;
