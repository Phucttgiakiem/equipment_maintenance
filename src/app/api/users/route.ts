import { NextResponse, type NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { userListQuerySchema } from "@/lib/users/schema";
import { listUsers } from "@/lib/users/service";

export async function GET(request: NextRequest) {
  const { response } = await requireRole(["admin"]);
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const parsed = userListQuerySchema.safeParse({
    registrationStatus: searchParams.get("registrationStatus") ?? undefined,
    role: searchParams.get("role") ?? undefined,
    isActive: searchParams.get("isActive") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const records = await listUsers(parsed.data);
  return NextResponse.json({ data: records });
}
