import type { HTMLAttributes } from "react";

export const CARD_CLASSES = "rounded-card border border-border bg-surface shadow-card";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`${CARD_CLASSES} ${className}`} {...props} />;
}
