"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonClasses } from "@/components/ui/button";

export function ResetPasswordButton({ userId, userName }: { userId: string; userName: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    const newPassword = window.prompt(
      `Enter a new temporary password for "${userName}" (min 8 characters):`,
    );
    if (!newPassword) return;

    setIsSubmitting(true);
    setError(null);

    const response = await fetch(`/api/users/${userId}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Failed to reset password.");
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
        className={`${buttonClasses("secondary")} px-3 py-1 text-xs`}
      >
        {isSubmitting ? "Resetting..." : "Reset password"}
      </button>
      {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}
