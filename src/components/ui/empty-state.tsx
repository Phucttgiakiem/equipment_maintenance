import type { ReactNode } from "react";
import { SearchIcon, type IconProps } from "@/components/ui/icons";

export function EmptyState({
  icon: IconComponent = SearchIcon,
  title,
  description,
}: {
  icon?: (props: IconProps) => ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-border bg-surface px-6 py-10 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-muted">
        <IconComponent className="h-5 w-5" />
      </span>
      <p className="text-base font-semibold text-ink">{title}</p>
      {description ? (
        <p className="max-w-[340px] text-sm leading-5 text-muted">{description}</p>
      ) : null}
    </div>
  );
}
