import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import { bootstrapDatabaseSchema } from "./bootstrap";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

let bootstrapPromise: Promise<void> | null = null;

export function ensureDatabaseReady(): Promise<void> {
  if (!bootstrapPromise) {
    bootstrapPromise = bootstrapDatabaseSchema(pool);
  }

  return bootstrapPromise;
}

export * from "./schema";
