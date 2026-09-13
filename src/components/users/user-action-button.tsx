"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonClasses } from "@/components/ui/button";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (confirmMessage && !window.confirm(confirmMessage)) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const response = await fetch(endpoint, { method: "POST" });

    setIsSubmitting(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Action failed.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isSubmitting}
        className={`${buttonClasses(variant)} px-3 py-1 text-xs`}
      >
        {isSubmitting ? pendingLabel : label}
      </button>
      {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}
