import { NextResponse, type NextRequest } from "next/server";
import { requireRole, requireSession } from "@/lib/auth/guard";
import {
  createMaintenanceSchema,
  maintenanceListQuerySchema,
} from "@/lib/maintenance/schema";
import {
  MaintenanceReferenceError,
  createMaintenanceRecord,
  listMaintenanceRecords,
} from "@/lib/maintenance/service";

export async function GET(request: NextRequest) {
  const { response } = await requireSession();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const parsed = maintenanceListQuerySchema.safeParse({
    equipmentId: searchParams.get("equipmentId") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    technicianId: searchParams.get("technicianId") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const records = await listMaintenanceRecords(parsed.data);
  return NextResponse.json({ data: records });
}

export async function POST(request: NextRequest) {
  const { session, response } = await requireRole(["admin"]);
  if (response) return response;

  const body = await request.json().catch(() => null);
  const parsed = createMaintenanceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid maintenance data", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const record = await createMaintenanceRecord(parsed.data, session.user.id);
    return NextResponse.json({ data: record }, { status: 201 });
  } catch (error) {
    if (error instanceof MaintenanceReferenceError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
