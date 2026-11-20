// Drizzle client factory over Neon's HTTP driver. Shared by the app
// (src/db/index.ts) and scripts such as the seed, which run outside Next.

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export function createDb(url = process.env.DATABASE_URL) {
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add your Neon connection string to .env.local.",
    );
  }
  return drizzle(neon(url), { schema, casing: "snake_case" });
}

export type Database = ReturnType<typeof createDb>;
