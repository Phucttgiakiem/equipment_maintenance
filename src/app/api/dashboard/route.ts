import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/guard";
import {
  getEquipmentStatistics,
  getMaintenanceStatistics,
  getRecentActivity,
} from "@/lib/dashboard/service";

export async function GET() {
  const { response } = await requireSession();
  if (response) return response;

  const [equipmentStats, maintenanceStats, recentActivity] = await Promise.all([
    getEquipmentStatistics(),
    getMaintenanceStatistics(),
    getRecentActivity(),
  ]);

  return NextResponse.json({
    data: {
      equipment: equipmentStats,
      maintenance: maintenanceStats,
      recentActivity,
    },
  });
}
