import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Database = ReturnType<typeof drizzle<typeof schema>>;

let instance: Database | undefined;

function getDb(): Database {
  if (!instance) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    instance = drizzle(postgres(process.env.DATABASE_URL), { schema });
  }
  return instance;
}

/**
 * Lazily connects on first query rather than at import time, so route
 * modules can be loaded during `next build` without DATABASE_URL set.
 */
export const db = new Proxy({} as Database, {
  get(_target, prop) {
    const value = getDb()[prop as keyof Database];
    return typeof value === "function" ? value.bind(getDb()) : value;
  },
});
