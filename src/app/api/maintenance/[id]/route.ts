import { NextResponse, type NextRequest } from "next/server";
import { requireRole, requireSession } from "@/lib/auth/guard";
import { authorizeMaintenanceUpdate } from "@/lib/maintenance/authorize";
import {
  technicianSelfUpdateSchema,
  updateMaintenanceSchema,
} from "@/lib/maintenance/schema";
import {
  MaintenanceReferenceError,
  deleteMaintenanceRecord,
  getMaintenanceById,
  updateMaintenanceRecord,
} from "@/lib/maintenance/service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { response } = await requireSession();
  if (response) return response;

  const { id } = await params;
  const record = await getMaintenanceById(id);
  if (!record) {
    return NextResponse.json({ error: "Maintenance record not found" }, { status: 404 });
  }

  return NextResponse.json({ data: record });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { session, response } = await requireSession();
  if (response) return response;

  const { id } = await params;
  const existing = await getMaintenanceById(id);
  if (!existing) {
    return NextResponse.json({ error: "Maintenance record not found" }, { status: 404 });
  }

  const authorization = authorizeMaintenanceUpdate(session.user, existing);
  if (!authorization.allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const schema =
    authorization.scope === "full" ? updateMaintenanceSchema : technicianSelfUpdateSchema;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid maintenance data", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const record = await updateMaintenanceRecord(id, parsed.data);
    if (!record) {
      return NextResponse.json({ error: "Maintenance record not found" }, { status: 404 });
    }
    return NextResponse.json({ data: record });
  } catch (error) {
    if (error instanceof MaintenanceReferenceError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { response } = await requireRole(["admin"]);
  if (response) return response;

  const { id } = await params;
  const record = await deleteMaintenanceRecord(id);
  if (!record) {
    return NextResponse.json({ error: "Maintenance record not found" }, { status: 404 });
  }

  return NextResponse.json({ data: record });
}
