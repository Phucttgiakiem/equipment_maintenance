import type { equipmentStatusEnum } from "@/db/schema";

type EquipmentStatus = (typeof equipmentStatusEnum.enumValues)[number];

const STATUS_LABELS: Record<EquipmentStatus, string> = {
  operational: "Operational",
  under_maintenance: "Under maintenance",
  out_of_service: "Out of service",
  retired: "Retired",
};

const STATUS_CLASSES: Record<EquipmentStatus, string> = {
  operational:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  under_maintenance:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  out_of_service: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  retired: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400",
};

export function EquipmentStatusBadge({ status }: { status: EquipmentStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
