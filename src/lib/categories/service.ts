import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, equipment } from "@/db/schema";
import type { CreateCategoryInput, UpdateCategoryInput } from "./schema";

const POSTGRES_UNIQUE_VIOLATION = "23505";

export class CategoryNameConflictError extends Error {
  constructor() {
    super("Category name already exists");
    this.name = "CategoryNameConflictError";
  }
}

export class CategoryInUseError extends Error {
  constructor() {
    super("Category is referenced by existing equipment and cannot be deleted");
    this.name = "CategoryInUseError";
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

export async function listCategories() {
  return db.select().from(categories).orderBy(asc(categories.name));
}

export async function getCategoryById(id: string) {
  const [record] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return record ?? null;
}

export async function createCategory(input: CreateCategoryInput) {
  try {
    const [record] = await db.insert(categories).values(input).returning();
    return record;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new CategoryNameConflictError();
    }
    throw error;
  }
}

export async function updateCategory(id: string, input: UpdateCategoryInput) {
  try {
    const [record] = await db
      .update(categories)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return record ?? null;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new CategoryNameConflictError();
    }
    throw error;
  }
}

export async function deleteCategory(id: string) {
  const [inUse] = await db
    .select({ id: equipment.id })
    .from(equipment)
    .where(eq(equipment.categoryId, id))
    .limit(1);
  if (inUse) {
    throw new CategoryInUseError();
  }

  const [record] = await db.delete(categories).where(eq(categories.id, id)).returning();
  return record ?? null;
}
