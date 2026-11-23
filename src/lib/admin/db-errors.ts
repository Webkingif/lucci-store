// Postgres error codes surfaced through Drizzle (which wraps the driver error
// in `cause`).

function pgCode(error: unknown): string | undefined {
  for (let current = error, depth = 0; current && depth < 4; depth++) {
    if (typeof current !== "object") return undefined;
    const code = (current as { code?: unknown }).code;
    if (typeof code === "string" && /^[0-9A-Z]{5}$/.test(code)) return code;
    current = (current as { cause?: unknown }).cause;
  }
  return undefined;
}

export const isUniqueViolation = (error: unknown) => pgCode(error) === "23505";
export const isForeignKeyViolation = (error: unknown) =>
  pgCode(error) === "23503";
