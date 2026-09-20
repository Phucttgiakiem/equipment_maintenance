import type { HTMLAttributes } from "react";
import { CARD_CLASSES } from "@/components/ui/card";

export function DataCard({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`flex flex-col gap-3 p-4 ${CARD_CLASSES} ${className}`} {...props} />;
}
