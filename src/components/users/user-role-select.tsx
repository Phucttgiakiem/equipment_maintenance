"use client";

import { useRouter } from "next/navigation";
import { useState, type ChangeEvent } from "react";
import { Select } from "@/components/ui/form-controls";
import { userRoleValues } from "@/lib/users/schema";

type UserRole = (typeof userRoleValues)[number];

export function UserRoleSelect({
  userId,
  role,
  disabled,
}: {
  userId: string;
  role: UserRole;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextRole = event.target.value as UserRole;
    if (nextRole === role) return;

    setIsSubmitting(true);
    setError(null);

    const response = await fetch(`/api/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: nextRole }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Failed to change role.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-col gap-1">
      <Select
        aria-label="Role"
        value={role}
        onChange={handleChange}
        disabled={disabled || isSubmitting}
        className="px-2 py-1 text-xs"
      >
        {userRoleValues.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </Select>
      {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}
