import type { equipmentStatusEnum } from "@/db/schema";
import { StatusBadge } from "@/components/ui/status-badge";

type EquipmentStatus = (typeof equipmentStatusEnum.enumValues)[number];

const STATUS_LABELS: Record<EquipmentStatus, string> = {
  operational: "Operational",
  under_maintenance: "Under maintenance",
  out_of_service: "Out of service",
  retired: "Retired",
};

const STATUS_CLASSES: Record<EquipmentStatus, string> = {
  operational: "bg-[#DFF0E3] text-[#17602B] dark:bg-[#1F3A27] dark:text-[#8FD6A0]",
  under_maintenance: "bg-[#FAEAC6] text-[#7A4A00] dark:bg-[#40320F] dark:text-[#F2C15B]",
  out_of_service: "bg-[#F9DBD7] text-[#9B1C12] dark:bg-[#452220] dark:text-[#FF9F94]",
  retired: "bg-[#E7E5DF] text-[#4A463E] dark:bg-[#2C2F2D] dark:text-[#B8BAB3]",
};

export function EquipmentStatusBadge({ status }: { status: EquipmentStatus }) {
  return <StatusBadge label={STATUS_LABELS[status]} className={STATUS_CLASSES[status]} />;
}
