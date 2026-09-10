import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { maintenanceRecords } from "@/db/schema";
import type {
  CreateMaintenanceInput,
  MaintenanceListQuery,
  TechnicianSelfUpdateInput,
  UpdateMaintenanceInput,
} from "./schema";

const POSTGRES_FOREIGN_KEY_VIOLATION = "23503";

export class MaintenanceReferenceError extends Error {
  constructor() {
    super("Referenced equipment or technician does not exist");
    this.name = "MaintenanceReferenceError";
  }
}

function isForeignKeyViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === POSTGRES_FOREIGN_KEY_VIOLATION
  );
}

export async function listMaintenanceRecords(filters: MaintenanceListQuery) {
  const conditions = [];

  if (filters.equipmentId) {
    conditions.push(eq(maintenanceRecords.equipmentId, filters.equipmentId));
  }
  if (filters.status) {
    conditions.push(eq(maintenanceRecords.status, filters.status));
  }
  if (filters.technicianId) {
    conditions.push(eq(maintenanceRecords.technicianId, filters.technicianId));
  }

  return db
    .select()
    .from(maintenanceRecords)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(maintenanceRecords.scheduledDate));
}

export async function getMaintenanceById(id: string) {
  const [record] = await db
    .select()
    .from(maintenanceRecords)
    .where(eq(maintenanceRecords.id, id))
    .limit(1);
  return record ?? null;
}

export async function createMaintenanceRecord(
  input: CreateMaintenanceInput,
  createdById: string,
) {
  try {
    const [record] = await db
      .insert(maintenanceRecords)
      .values({ ...input, createdById })
      .returning();
    return record;
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      throw new MaintenanceReferenceError();
    }
    throw error;
  }
}

export async function updateMaintenanceRecord(
  id: string,
  input: UpdateMaintenanceInput | TechnicianSelfUpdateInput,
) {
  try {
    const [record] = await db
      .update(maintenanceRecords)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(maintenanceRecords.id, id))
      .returning();
    return record ?? null;
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      throw new MaintenanceReferenceError();
    }
    throw error;
  }
}

export async function deleteMaintenanceRecord(id: string) {
  const [record] = await db
    .delete(maintenanceRecords)
    .where(eq(maintenanceRecords.id, id))
    .returning();
  return record ?? null;
}
