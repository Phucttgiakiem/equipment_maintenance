import { CheckIcon } from "@/components/ui/icons";

const STEPS = [
  { key: "scheduled", label: "Scheduled" },
  { key: "in_progress", label: "In progress" },
  { key: "completed", label: "Completed" },
] as const;

export function MaintenanceStepTracker({ status }: { status: string }) {
  if (status === "cancelled") {
    return <p className="text-sm text-muted">This maintenance record was cancelled.</p>;
  }

  const currentIndex = STEPS.findIndex((step) => step.key === status);

  return (
    <div className="flex items-start">
      {STEPS.map((step, index) => {
        const done = currentIndex >= 0 && index < currentIndex;
        const current = index === currentIndex;
        return (
          <div key={step.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={`flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold ${
                  done
                    ? "border-accent bg-accent text-accent-fg"
                    : current
                      ? "border-accent text-accent"
                      : "border-border text-muted"
                }`}
              >
                {done ? <CheckIcon className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <span className={`text-xs ${current ? "font-medium text-ink" : "text-muted"}`}>
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 ? (
              <div className={`mx-2 h-0.5 flex-1 ${done ? "bg-accent" : "bg-border"}`} />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
