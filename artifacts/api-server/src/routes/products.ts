import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, productsTable, usersTable } from "@workspace/db";
import { CreateProductBody, GetProductsQueryParams, UpdateProductParams, UpdateProductBody, DeleteProductParams } from "@workspace/api-zod";
import { requireAuth } from "./users";
import { getProductImageUrl } from "../lib/product-image";

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

function formatProduct(p: typeof productsTable.$inferSelect) {
  return {
    ...p,
    imageUrl: getProductImageUrl(p.name, p.imageUrl),
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/products", async (req, res): Promise<void> => {
  const qParams = GetProductsQueryParams.safeParse(req.query);

  let products = await db.select().from(productsTable);

  if (qParams.success && qParams.data.category) {
    products = products.filter(p => p.category === qParams.data.category);
  }

  res.json(products.map(formatProduct));
});

router.post("/products", async (req, res): Promise<void> => {
  const isAdmin = await requireAdmin(req, res);
  if (!isAdmin) return;

  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [product] = await db.insert(productsTable).values({
    name: parsed.data.name,
    description: parsed.data.description,
    price: parsed.data.price,
    category: parsed.data.category,
    imageUrl: parsed.data.imageUrl ?? null,
    inStock: parsed.data.inStock,
  }).returning();

  res.status(201).json(formatProduct(product));
});

router.put("/products/:productId", async (req, res): Promise<void> => {
  const isAdmin = await requireAdmin(req, res);
  if (!isAdmin) return;

  const params = UpdateProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [product] = await db
    .update(productsTable)
    .set({
      name: parsed.data.name,
      description: parsed.data.description,
      price: parsed.data.price,
      category: parsed.data.category,
      imageUrl: parsed.data.imageUrl ?? null,
      inStock: parsed.data.inStock,
    })
    .where(eq(productsTable.id, params.data.productId))
    .returning();

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(formatProduct(product));
});

router.delete("/products/:productId", async (req, res): Promise<void> => {
  const isAdmin = await requireAdmin(req, res);
  if (!isAdmin) return;

  const params = DeleteProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(productsTable).where(eq(productsTable.id, params.data.productId));

  res.json({ message: "Product deleted" });
});

export default router;
