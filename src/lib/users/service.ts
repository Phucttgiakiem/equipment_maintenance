import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function listActiveTechnicians() {
  return db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(and(eq(users.role, "technician"), eq(users.isActive, true)));
}
