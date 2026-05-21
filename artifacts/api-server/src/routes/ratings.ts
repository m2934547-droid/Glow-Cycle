import { Router, type IRouter } from "express";
import { eq, avg, count } from "drizzle-orm";
import { db, productRatingsTable } from "@workspace/db";
import { RateProductBody, GetProductRatingsParams } from "@workspace/api-zod";
import { requireAuth } from "./users";

const router: IRouter = Router();

function serialize(r: typeof productRatingsTable.$inferSelect) {
  return {
    id: r.id,
    userId: r.userId,
    productId: r.productId,
    rating: r.rating,
    review: r.review ?? null,
    createdAt: r.createdAt.toISOString(),
  };
}

router.post("/ratings", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const parsed = RateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { productId, rating, review } = parsed.data;

  if (rating < 1 || rating > 5) {
    res.status(400).json({ error: "Rating must be between 1 and 5" });
    return;
  }

  const existing = await db
    .select()
    .from(productRatingsTable)
    .where(eq(productRatingsTable.userId, userId));

  const alreadyRated = existing.find((r) => r.productId === productId);

  if (alreadyRated) {
    const [updated] = await db
      .update(productRatingsTable)
      .set({ rating, review: review ?? null })
      .where(eq(productRatingsTable.id, alreadyRated.id))
      .returning();
    res.status(201).json(serialize(updated));
    return;
  }

  const [created] = await db
    .insert(productRatingsTable)
    .values({ userId, productId, rating, review: review ?? null })
    .returning();

  res.status(201).json(serialize(created));
});

router.get("/ratings/product/:productId", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const params = GetProductRatingsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const ratings = await db
    .select()
    .from(productRatingsTable)
    .where(eq(productRatingsTable.productId, params.data.productId));

  const avgRating =
    ratings.length > 0
      ? Math.round((ratings.reduce((s, r) => s + r.rating, 0) / ratings.length) * 10) / 10
      : 0;

  const userRating = ratings.find((r) => r.userId === userId)?.rating ?? null;

  res.json({
    averageRating: avgRating,
    totalRatings: ratings.length,
    userRating,
    ratings: ratings.map(serialize),
  });
});

router.get("/ratings/my", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const ratings = await db
    .select()
    .from(productRatingsTable)
    .where(eq(productRatingsTable.userId, userId));

  res.json(ratings.map(serialize));
});

export default router;
