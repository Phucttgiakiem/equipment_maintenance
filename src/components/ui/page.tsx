import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeftIcon } from "@/components/ui/icons";

export function PageContainer({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-1 flex-col gap-4 p-4 md:gap-5 md:p-6 lg:gap-6 lg:p-8 ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  meta,
  back,
  actions,
}: {
  title: string;
  description?: ReactNode;
  meta?: ReactNode;
  back?: { href: string; label: string };
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        {back ? (
          <Link
            href={back.href}
            className="flex min-h-5 items-center gap-1 text-[13px] font-medium text-muted hover:text-ink"
          >
            <ChevronLeftIcon className="h-[18px] w-[18px]" />
            {back.label}
          </Link>
        ) : null}
        <h1 className="text-[22px] font-semibold text-ink md:text-2xl lg:text-[26px]">{title}</h1>
        {description ? <p className="text-sm text-muted">{description}</p> : null}
        {meta ? <div className="flex flex-wrap items-center gap-2.5">{meta}</div> : null}
      </div>
      {actions ? <div className="flex flex-shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
