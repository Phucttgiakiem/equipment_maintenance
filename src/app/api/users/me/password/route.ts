import { NextResponse, type NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/guard";
import { changePasswordSchema } from "@/lib/users/schema";
import { InvalidCurrentPasswordError, changePassword } from "@/lib/users/service";

export async function PATCH(request: NextRequest) {
  const { session, response } = await requireSession();
  if (response) return response;

  const body = await request.json().catch(() => null);
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid password data", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    await changePassword(session.user.id, parsed.data.currentPassword, parsed.data.newPassword);
    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    if (error instanceof InvalidCurrentPasswordError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
