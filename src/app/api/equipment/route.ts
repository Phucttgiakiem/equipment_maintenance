import { NextResponse, type NextRequest } from "next/server";
import { requireRole, requireSession } from "@/lib/auth/guard";
import {
  createEquipmentSchema,
  equipmentListQuerySchema,
} from "@/lib/equipment/schema";
import {
  EquipmentCodeConflictError,
  createEquipment,
  listEquipment,
} from "@/lib/equipment/service";

export async function GET(request: NextRequest) {
  const { response } = await requireSession();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const parsed = equipmentListQuerySchema.safeParse({
    search: searchParams.get("search") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    category: searchParams.get("category") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const records = await listEquipment(parsed.data);
  return NextResponse.json({ data: records });
}

export async function POST(request: NextRequest) {
  const { session, response } = await requireRole(["admin"]);
  if (response) return response;

  const body = await request.json().catch(() => null);
  const parsed = createEquipmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid equipment data", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const record = await createEquipment(parsed.data, session.user.id);
    return NextResponse.json({ data: record }, { status: 201 });
  } catch (error) {
    if (error instanceof EquipmentCodeConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
