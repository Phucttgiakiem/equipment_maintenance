import { NextResponse, type NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import {
  InvalidRegistrationStateError,
  SelfActionError,
  deactivateUser,
  getUserById,
} from "@/lib/users/service";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, { params }: RouteParams) {
  const { session, response } = await requireRole(["admin"]);
  if (response) return response;

  const { id } = await params;
  const existing = await getUserById(id);
  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    const record = await deactivateUser(existing, session.user.id);
    return NextResponse.json({ data: record });
  } catch (error) {
    if (error instanceof SelfActionError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof InvalidRegistrationStateError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
