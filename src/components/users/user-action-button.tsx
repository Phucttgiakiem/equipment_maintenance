"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonClasses } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function UserActionButton({
  endpoint,
  label,
  pendingLabel,
  variant = "secondary",
  confirmMessage,
}: {
  endpoint: string;
  label: string;
  pendingLabel: string;
  variant?: "primary" | "secondary" | "danger";
  confirmMessage?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function performAction() {
    setIsSubmitting(true);
    setError(null);

    const response = await fetch(endpoint, { method: "POST" });

    setIsSubmitting(false);
    setOpen(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Action failed.");
      return;
    }

    router.refresh();
  }

  function handleClick() {
    if (confirmMessage) {
      setOpen(true);
      return;
    }
    void performAction();
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isSubmitting}
        className={`${buttonClasses(variant)} h-8 px-3 text-xs`}
      >
        {isSubmitting ? pendingLabel : label}
      </button>
      {error ? <p className="text-xs text-danger-hover">{error}</p> : null}
      {confirmMessage ? (
        <ConfirmDialog
          open={open}
          title={label}
          message={confirmMessage}
          confirmLabel={label}
          danger={variant === "danger"}
          isSubmitting={isSubmitting}
          onConfirm={() => void performAction()}
          onCancel={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}
