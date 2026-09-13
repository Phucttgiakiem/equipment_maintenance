import bcrypt from "bcryptjs";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import type { Role } from "@/lib/auth/roles";
import type { RegisterInput, UserListQuery } from "./schema";

const POSTGRES_UNIQUE_VIOLATION = "23505";

export class EmailConflictError extends Error {
  constructor() {
    super("Email is already registered");
    this.name = "EmailConflictError";
  }
}

export class InvalidRegistrationStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidRegistrationStateError";
  }
}

export class SelfActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SelfActionError";
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

// Excludes passwordHash so it never reaches a route handler's JSON response.
const userColumns = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  isActive: users.isActive,
  registrationStatus: users.registrationStatus,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
};

type UserSummary = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  registrationStatus: "pending" | "approved" | "rejected";
  createdAt: Date;
  updatedAt: Date;
};

export async function listActiveTechnicians() {
  return db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(and(eq(users.role, "technician"), eq(users.isActive, true)));
}

export async function listUsers(filters: UserListQuery): Promise<UserSummary[]> {
  const conditions = [];

  if (filters.registrationStatus) {
    conditions.push(eq(users.registrationStatus, filters.registrationStatus));
  }
  if (filters.role) {
    conditions.push(eq(users.role, filters.role));
  }
  if (filters.isActive !== undefined) {
    conditions.push(eq(users.isActive, filters.isActive));
  }

  return db
    .select(userColumns)
    .from(users)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(users.name));
}

export async function getUserById(id: string): Promise<UserSummary | null> {
  const [record] = await db.select(userColumns).from(users).where(eq(users.id, id)).limit(1);
  return record ?? null;
}

export async function registerUser(input: RegisterInput): Promise<UserSummary> {
  const passwordHash = await bcrypt.hash(input.password, 10);

  try {
    const [record] = await db
      .insert(users)
      .values({
        name: input.name,
        email: input.email,
        passwordHash,
        role: "technician",
        registrationStatus: "pending",
        isActive: false,
      })
      .returning(userColumns);
    return record;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new EmailConflictError();
    }
    throw error;
  }
}

/**
 * Approve/reject only apply to a `pending` registration; calling either on a
 * user in any other state is a conflict, not a validation error, since the
 * request is well-formed but the target's state disallows it.
 */
export async function approveUser(user: UserSummary): Promise<UserSummary> {
  if (user.registrationStatus !== "pending") {
    throw new InvalidRegistrationStateError("Only pending registrations can be approved");
  }

  const [record] = await db
    .update(users)
    .set({ registrationStatus: "approved", isActive: true, updatedAt: new Date() })
    .where(eq(users.id, user.id))
    .returning(userColumns);
  return record;
}

export async function rejectUser(user: UserSummary): Promise<UserSummary> {
  if (user.registrationStatus !== "pending") {
    throw new InvalidRegistrationStateError("Only pending registrations can be rejected");
  }

  const [record] = await db
    .update(users)
    .set({ registrationStatus: "rejected", updatedAt: new Date() })
    .where(eq(users.id, user.id))
    .returning(userColumns);
  return record;
}

/**
 * Activation/deactivation is separate from approval and only applies to an
 * already-`approved` user (REQUIREMENTS.md §3) — a pending/rejected account
 * must go through approval first.
 */
export async function activateUser(user: UserSummary): Promise<UserSummary> {
  if (user.registrationStatus !== "approved") {
    throw new InvalidRegistrationStateError("Only approved users can be activated");
  }

  const [record] = await db
    .update(users)
    .set({ isActive: true, updatedAt: new Date() })
    .where(eq(users.id, user.id))
    .returning(userColumns);
  return record;
}

export async function deactivateUser(
  user: UserSummary,
  actingUserId: string,
): Promise<UserSummary> {
  if (user.id === actingUserId) {
    throw new SelfActionError("Cannot deactivate your own account");
  }
  if (user.registrationStatus !== "approved") {
    throw new InvalidRegistrationStateError("Only approved users can be deactivated");
  }

  const [record] = await db
    .update(users)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(users.id, user.id))
    .returning(userColumns);
  return record;
}

export async function changeUserRole(
  user: UserSummary,
  role: Role,
  actingUserId: string,
): Promise<UserSummary> {
  if (user.id === actingUserId) {
    throw new SelfActionError("Cannot change your own role");
  }

  const [record] = await db
    .update(users)
    .set({ role, updatedAt: new Date() })
    .where(eq(users.id, user.id))
    .returning(userColumns);
  return record;
}
