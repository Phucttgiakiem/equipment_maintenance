import { NextResponse, type NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { InvalidRegistrationStateError, getUserById, rejectUser } from "@/lib/users/service";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, { params }: RouteParams) {
  const { response } = await requireRole(["admin"]);
  if (response) return response;

  const { id } = await params;
  const existing = await getUserById(id);
  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    const record = await rejectUser(existing);
    return NextResponse.json({ data: record });
  } catch (error) {
    if (error instanceof InvalidRegistrationStateError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
