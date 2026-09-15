import { NextResponse, type NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { resetPasswordSchema } from "@/lib/users/schema";
import { SelfActionError, getUserById, resetPassword } from "@/lib/users/service";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { session, response } = await requireRole(["admin"]);
  if (response) return response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid password data", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await getUserById(id);
  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    const record = await resetPassword(existing, parsed.data.newPassword, session.user.id);
    return NextResponse.json({ data: record });
  } catch (error) {
    if (error instanceof SelfActionError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    throw error;
  }
}
