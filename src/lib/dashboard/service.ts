import { count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  equipment,
  equipmentStatusEnum,
  maintenanceRecords,
  maintenanceStatusEnum,
  maintenanceTypeEnum,
} from "@/db/schema";

type EquipmentStatus = (typeof equipmentStatusEnum.enumValues)[number];
type MaintenanceStatus = (typeof maintenanceStatusEnum.enumValues)[number];
type MaintenanceType = (typeof maintenanceTypeEnum.enumValues)[number];

export type EquipmentStatistics = {
  total: number;
  byStatus: Record<EquipmentStatus, number>;
};

export type MaintenanceStatistics = {
  total: number;
  byStatus: Record<MaintenanceStatus, number>;
  byType: Record<MaintenanceType, number>;
};

export type RecentActivityItem = {
  id: string;
  equipmentId: string;
  equipmentName: string;
  type: MaintenanceType;
  status: MaintenanceStatus;
  updatedAt: Date;
};

const RECENT_ACTIVITY_LIMIT = 10;

function zeroCounts<T extends string>(values: readonly T[]): Record<T, number> {
  return Object.fromEntries(values.map((value) => [value, 0])) as Record<T, number>;
}

export async function getEquipmentStatistics(): Promise<EquipmentStatistics> {
  const rows = await db
    .select({ status: equipment.status, count: count() })
    .from(equipment)
    .groupBy(equipment.status);

  const byStatus = zeroCounts(equipmentStatusEnum.enumValues);
  let total = 0;
  for (const row of rows) {
    byStatus[row.status] = row.count;
    total += row.count;
  }

  return { total, byStatus };
}

export async function getMaintenanceStatistics(): Promise<MaintenanceStatistics> {
  const [statusRows, typeRows] = await Promise.all([
    db
      .select({ status: maintenanceRecords.status, count: count() })
      .from(maintenanceRecords)
      .groupBy(maintenanceRecords.status),
    db
      .select({ type: maintenanceRecords.type, count: count() })
      .from(maintenanceRecords)
      .groupBy(maintenanceRecords.type),
  ]);

  const byStatus = zeroCounts(maintenanceStatusEnum.enumValues);
  const byType = zeroCounts(maintenanceTypeEnum.enumValues);
  let total = 0;
  for (const row of statusRows) {
    byStatus[row.status] = row.count;
    total += row.count;
  }
  for (const row of typeRows) {
    byType[row.type] = row.count;
  }

  return { total, byStatus, byType };
}

export async function getRecentActivity(
  limit = RECENT_ACTIVITY_LIMIT,
): Promise<RecentActivityItem[]> {
  return db
    .select({
      id: maintenanceRecords.id,
      equipmentId: maintenanceRecords.equipmentId,
      equipmentName: equipment.name,
      type: maintenanceRecords.type,
      status: maintenanceRecords.status,
      updatedAt: maintenanceRecords.updatedAt,
    })
    .from(maintenanceRecords)
    .innerJoin(equipment, eq(maintenanceRecords.equipmentId, equipment.id))
    .orderBy(desc(maintenanceRecords.updatedAt))
    .limit(limit);
}
