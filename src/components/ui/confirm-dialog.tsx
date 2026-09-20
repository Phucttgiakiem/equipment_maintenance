"use client";

import { useEffect } from "react";
import { Button } from "./button";

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  danger = true,
  isSubmitting = false,
  errorTitle,
  errorMessage,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  isSubmitting?: boolean;
  errorTitle?: string;
  errorMessage?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  if (errorMessage) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        onClick={onCancel}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={errorTitle ?? "Could not complete this action"}
          onClick={(event) => event.stopPropagation()}
          className="flex w-full max-w-sm flex-col gap-3 rounded-dialog border border-border bg-surface p-6 shadow-dialog"
        >
          <h2 className="text-lg font-semibold text-ink">
            {errorTitle ?? "Could not complete this action"}
          </h2>
          <p className="text-sm leading-5 text-muted">{errorMessage}</p>
          <div className="mt-2 flex justify-end">
            <Button type="button" variant="secondary" onClick={onCancel}>
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className="flex w-full max-w-sm flex-col gap-3 rounded-dialog border border-border bg-surface p-6 shadow-dialog"
      >
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        <p className="text-sm leading-5 text-muted">{message}</p>
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={danger ? "danger" : "primary"}
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Working..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
