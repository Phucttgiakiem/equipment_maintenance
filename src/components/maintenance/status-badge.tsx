import type { maintenanceStatusEnum } from "@/db/schema";
import { StatusBadge } from "@/components/ui/status-badge";

type MaintenanceStatus = (typeof maintenanceStatusEnum.enumValues)[number];

const STATUS_LABELS: Record<MaintenanceStatus, string> = {
  scheduled: "Scheduled",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_CLASSES: Record<MaintenanceStatus, string> = {
  scheduled: "bg-[#DCE8F7] text-[#1F4A8A] dark:bg-[#1E3350] dark:text-[#9CC3F5]",
  in_progress: "bg-[#FAEAC6] text-[#7A4A00] dark:bg-[#40320F] dark:text-[#F2C15B]",
  completed: "bg-[#DFF0E3] text-[#17602B] dark:bg-[#1F3A27] dark:text-[#8FD6A0]",
  cancelled: "bg-[#E7E5DF] text-[#4A463E] dark:bg-[#2C2F2D] dark:text-[#B8BAB3]",
};

export function MaintenanceStatusBadge({ status }: { status: MaintenanceStatus }) {
  return <StatusBadge label={STATUS_LABELS[status]} className={STATUS_CLASSES[status]} />;
}
