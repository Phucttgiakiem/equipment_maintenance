import type { registrationStatusEnum } from "@/db/schema";
import { StatusBadge } from "@/components/ui/status-badge";

type RegistrationStatus = (typeof registrationStatusEnum.enumValues)[number];

const STATUS_LABELS: Record<RegistrationStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

const STATUS_CLASSES: Record<RegistrationStatus, string> = {
  pending: "bg-[#FAEAC6] text-[#7A4A00] dark:bg-[#40320F] dark:text-[#F2C15B]",
  approved: "bg-[#DFF0E3] text-[#17602B] dark:bg-[#1F3A27] dark:text-[#8FD6A0]",
  rejected: "bg-[#F9DBD7] text-[#9B1C12] dark:bg-[#452220] dark:text-[#FF9F94]",
};

export function RegistrationStatusBadge({ status }: { status: RegistrationStatus }) {
  return <StatusBadge label={STATUS_LABELS[status]} className={STATUS_CLASSES[status]} />;
}
