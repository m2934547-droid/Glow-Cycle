import { eq } from "drizzle-orm";
import { db, ensureDatabaseReady, productsTable, usersTable } from "@workspace/db";
import { logger } from "./logger";
import { hashPassword } from "./password";
import { OVERNIGHT_MAXI_PADS_IMAGE_URL } from "./product-image";

const defaultProducts: Array<{
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
}> = [
  { name: "Ultra Soft Sanitary Pads", description: "Breathable and rash-free pads for daily comfort.", price: 149, category: "Sanitary Pads", imageUrl: "/ultra-soft-sanitary-pads.jpg" },
  { name: "Overnight Maxi Pads", description: "Extra long overnight protection with leak-lock core.", price: 189, category: "Sanitary Pads", imageUrl: OVERNIGHT_MAXI_PADS_IMAGE_URL },
  { name: "Organic Cotton Tampons", description: "Chemical-free tampons made with organic cotton.", price: 229, category: "Tampons", imageUrl: "/organic-cotton-tampons.png" },
  { name: "Super Absorbency Tampons", description: "For heavy flow days with smooth insertion.", price: 249, category: "Tampons", imageUrl: "/super-absorbency-tampons.jpg" },
  { name: "Reusable Menstrual Cup - Small", description: "Medical-grade silicone cup for up to 8 hours.", price: 599, category: "Menstrual Cups", imageUrl: "/reusable-menstrual-cup-small.jpg" },
  { name: "Reusable Menstrual Cup - Large", description: "Comfort-fit large size cup for long wear.", price: 649, category: "Menstrual Cups", imageUrl: "/reusable-menstrual-cup-large.jpg" },
  { name: "Ibuprofen Pain Relief", description: "Fast acting relief for cramps and body pain.", price: 99, category: "Pain Relief", imageUrl: "/ibuprofen-pain-relief.jpg" },
  { name: "Herbal Cramp Relief Tea", description: "Natural ginger and chamomile blend for cramp support.", price: 199, category: "Pain Relief", imageUrl: "/herbal-cramp-relief-tea.jpg" },
  { name: "Electric Heating Pad", description: "Adjustable heat levels for abdominal comfort.", price: 899, category: "Heating Pads", imageUrl: "/electric-heating-pad.jpg" },
  { name: "Microwave Heat Pack", description: "Lavender infused reusable heat pack.", price: 349, category: "Heating Pads", imageUrl: "/microwave-heat-pack.png" },
  { name: "Self-Care Comfort Kit", description: "Includes tea, eye mask, and soothing balm.", price: 499, category: "Comfort Kits", imageUrl: "/self-care-comfort-kit.png" },
  { name: "Period Emergency Pouch", description: "Portable pouch with pads, wipes, and disposal bags.", price: 279, category: "Comfort Kits", imageUrl: "/period-emergency-pouch.jpg" },
];

export async function bootstrapAppData(): Promise<void> {
  await ensureDatabaseReady();

  const adminEmail = "admin@glowcycle.com";
  const testUserEmail = "sarah@example.com";

  const [admin] = await db.select().from(usersTable).where(eq(usersTable.email, adminEmail));
  if (!admin) {
    await db.insert(usersTable).values({
      name: "Admin",
      email: adminEmail,
      passwordHash: await hashPassword("admin123"),
      age: 30,
      heightCm: 165,
      weightKg: 60,
      isAdmin: true,
      isVerified: true,
      phoneNumber: "+911111111111",
    });
    logger.info("Seeded admin user");
  } else if (!admin.isVerified) {
    await db.update(usersTable).set({ isVerified: true }).where(eq(usersTable.id, admin.id));
  }

  const [testUser] = await db.select().from(usersTable).where(eq(usersTable.email, testUserEmail));
  if (!testUser) {
    await db.insert(usersTable).values({
      name: "Sarah",
      email: testUserEmail,
      passwordHash: await hashPassword("test123"),
      age: 25,
      heightCm: 162,
      weightKg: 54,
      isAdmin: false,
      isVerified: true,
      phoneNumber: "+919999999999",
    });
    logger.info("Seeded demo user");
  } else if (!testUser.isVerified) {
    await db.update(usersTable).set({ isVerified: true }).where(eq(usersTable.id, testUser.id));
  }

  const products = await db.select().from(productsTable).limit(1);
  if (products.length === 0) {
    await db.insert(productsTable).values(
      defaultProducts.map((product) => ({
        ...product,
        inStock: true,
      })),
    );
    logger.info({ count: defaultProducts.length }, "Seeded default store products");
  }

  const storeCountResult = await db.execute(`SELECT COUNT(*)::int AS count FROM stores`);
  const storeCount = Number((storeCountResult.rows[0] as { count?: number } | undefined)?.count ?? 0);
  if (storeCount === 0) {
    await db.execute(`
      INSERT INTO stores (name, address, latitude, longitude)
      VALUES
        ('GlowCycle Chandigarh Flagship', 'SCO 45, Sector 17, Chandigarh, India', 30.7398, 76.7829),
        ('GlowCycle Mohali Studio', 'Phase 7, SAS Nagar, Mohali, Punjab, India', 30.7046, 76.7179),
        ('GlowCycle Ludhiana Hub', 'Ferozepur Road, Ludhiana, Punjab, India', 30.9000, 75.8573),
        ('GlowCycle Amritsar Care Point', 'Lawrence Road, Amritsar, Punjab, India', 31.6340, 74.8723)
    `);
    logger.info("Seeded store locator locations");
  }
}
