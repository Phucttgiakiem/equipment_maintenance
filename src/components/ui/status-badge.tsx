export function StatusBadge({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={`inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-xs font-medium ${className}`}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

export function OutlinePill({ label }: { label: string }) {
  return (
    <span className="inline-flex h-6 items-center whitespace-nowrap rounded-full border border-border px-2.5 text-xs font-medium capitalize text-muted">
      {label}
    </span>
  );
}
