import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { hasRequiredRole, type Role } from "./roles";

type GuardSuccess = { session: Session; response: null };
type GuardFailure = { session: null; response: NextResponse };

/**
 * Verifies there is an authenticated session. Route handlers should return
 * `response` immediately when present rather than continuing.
 */
export async function requireSession(): Promise<GuardSuccess | GuardFailure> {
  const session = await auth();
  if (!session?.user) {
    return {
      session: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { session, response: null };
}

/**
 * Verifies there is an authenticated session AND the user's role is one of
 * `allowed`. Use in route handlers for admin-only (or role-gated) actions.
 */
export async function requireRole(
  allowed: Role[],
): Promise<GuardSuccess | GuardFailure> {
  const result = await requireSession();
  if (result.response) {
    return result;
  }

  if (!hasRequiredRole(result.session.user.role, allowed)) {
    return {
      session: null,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return result;
}
