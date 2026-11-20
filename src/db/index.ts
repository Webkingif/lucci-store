import "server-only";
import { createDb } from "./client";

/** App database client. Server-only: never import from client components. */
export const db = createDb();
