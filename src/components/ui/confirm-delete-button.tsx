"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ConfirmDeleteButton({
  endpoint,
  confirmMessage,
  redirectTo,
}: {
  endpoint: string;
  confirmMessage: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    const response = await fetch(endpoint, { method: "DELETE" });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Failed to delete.");
      setIsDeleting(false);
      return;
    }

    if (redirectTo) {
      router.push(redirectTo);
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className="text-sm font-medium text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-400"
      >
        {isDeleting ? "Deleting..." : "Delete"}
      </button>
      {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}
