import { NextResponse, type NextRequest } from "next/server";
import { requireRole, requireSession } from "@/lib/auth/guard";
import { updateEquipmentSchema } from "@/lib/equipment/schema";
import {
  EquipmentCodeConflictError,
  deleteEquipment,
  getEquipmentById,
  updateEquipment,
} from "@/lib/equipment/service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { response } = await requireSession();
  if (response) return response;

  const { id } = await params;
  const record = await getEquipmentById(id);
  if (!record) {
    return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
  }

  return NextResponse.json({ data: record });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { response } = await requireRole(["admin"]);
  if (response) return response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateEquipmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid equipment data", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const record = await updateEquipment(id, parsed.data);
    if (!record) {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
    }
    return NextResponse.json({ data: record });
  } catch (error) {
    if (error instanceof EquipmentCodeConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { response } = await requireRole(["admin"]);
  if (response) return response;

  const { id } = await params;
  const record = await deleteEquipment(id);
  if (!record) {
    return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
  }

  return NextResponse.json({ data: record });
}
