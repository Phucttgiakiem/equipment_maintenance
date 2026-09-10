import { and, asc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { equipment } from "@/db/schema";
import type {
  CreateEquipmentInput,
  EquipmentListQuery,
  UpdateEquipmentInput,
} from "./schema";

const POSTGRES_UNIQUE_VIOLATION = "23505";

export class EquipmentCodeConflictError extends Error {
  constructor() {
    super("Equipment code already exists");
    this.name = "EquipmentCodeConflictError";
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === POSTGRES_UNIQUE_VIOLATION
  );
}

export async function listEquipment(filters: EquipmentListQuery) {
  const conditions = [];

  if (filters.search) {
    const term = `%${filters.search}%`;
    conditions.push(or(ilike(equipment.name, term), ilike(equipment.code, term)));
  }
  if (filters.status) {
    conditions.push(eq(equipment.status, filters.status));
  }
  if (filters.category) {
    conditions.push(eq(equipment.category, filters.category));
  }

  return db
    .select()
    .from(equipment)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(equipment.name));
}

export async function getEquipmentById(id: string) {
  const [record] = await db
    .select()
    .from(equipment)
    .where(eq(equipment.id, id))
    .limit(1);
  return record ?? null;
}

export async function createEquipment(
  input: CreateEquipmentInput,
  createdById: string,
) {
  try {
    const [record] = await db
      .insert(equipment)
      .values({ ...input, createdById })
      .returning();
    return record;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new EquipmentCodeConflictError();
    }
    throw error;
  }
}

export async function updateEquipment(id: string, input: UpdateEquipmentInput) {
  try {
    const [record] = await db
      .update(equipment)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(equipment.id, id))
      .returning();
    return record ?? null;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new EquipmentCodeConflictError();
    }
    throw error;
  }
}

export async function deleteEquipment(id: string) {
  const [record] = await db
    .delete(equipment)
    .where(eq(equipment.id, id))
    .returning();
  return record ?? null;
}
