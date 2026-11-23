import "server-only";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

// Transactional client over Neon's WebSocket driver. The HTTP client in
// ./client.ts cannot run interactive transactions (SELECT ... FOR UPDATE), which
// checkout fulfilment needs. Use this only for order and stock writes;
// catalogue reads stay on the HTTP client. Node 22+ provides WebSocket globally.

let pool: Pool | undefined;

function getPool() {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set.");
    pool = new Pool({ connectionString: url });
  }
  return pool;
}

/** Drizzle client that supports `db.transaction(...)`. */
export function getTxDb() {
  return drizzle({ client: getPool(), schema, casing: "snake_case" });
}

export type TxDatabase = ReturnType<typeof getTxDb>;
