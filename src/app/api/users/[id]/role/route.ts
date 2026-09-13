import { NextResponse, type NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { changeRoleSchema } from "@/lib/users/schema";
import { SelfActionError, changeUserRole, getUserById } from "@/lib/users/service";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { session, response } = await requireRole(["admin"]);
  if (response) return response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = changeRoleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid role data", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await getUserById(id);
  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    const record = await changeUserRole(existing, parsed.data.role, session.user.id);
    return NextResponse.json({ data: record });
  } catch (error) {
    if (error instanceof SelfActionError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    throw error;
  }
}
