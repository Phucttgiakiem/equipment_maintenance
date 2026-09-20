"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonClasses } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function ConfirmDeleteButton({
  endpoint,
  title = "Delete this item?",
  confirmMessage,
  redirectTo,
  variant = "link",
  label = "Delete",
}: {
  endpoint: string;
  title?: string;
  confirmMessage: string;
  redirectTo?: string;
  variant?: "link" | "button";
  label?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
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

  function closeDialog() {
    setOpen(false);
    setError(null);
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={isDeleting}
        className={
          variant === "button"
            ? `${buttonClasses("secondary")} text-danger`
            : "text-sm font-medium text-danger hover:underline disabled:cursor-not-allowed disabled:opacity-45"
        }
      >
        {isDeleting ? "Deleting..." : label}
      </button>
      <ConfirmDialog
        open={open}
        title={title}
        message={confirmMessage}
        confirmLabel="Delete"
        isSubmitting={isDeleting}
        errorTitle="Cannot delete"
        errorMessage={error}
        onConfirm={handleDelete}
        onCancel={closeDialog}
      />
    </div>
  );
}
