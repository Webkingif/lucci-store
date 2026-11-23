// Admin stock writes. Every export authorizes itself, then delegates to the
// shared stock SQL in src/db/stock.ts (also used by checkout). Callers
// (Server Actions) refresh the storefront with updateTag afterwards.

import "server-only";
import { db } from "@/db";
import {
  adjustStockBy,
  setStockIf,
  type AdjustResult,
  type SetResult,
} from "@/db/stock";
import { requireAdmin } from "./auth";

/** Add (positive) or remove (negative) units without racing sales. */
export async function adjustStock(
  id: number,
  delta: number,
): Promise<AdjustResult> {
  await requireAdmin();
  return adjustStockBy(db, id, delta);
}

/** Replace the count, only if it still equals what the admin saw. */
export async function setStock(
  id: number,
  expected: number,
  next: number,
): Promise<SetResult> {
  await requireAdmin();
  return setStockIf(db, id, expected, next);
}
