"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-controls";
import { PasswordInput } from "@/components/ui/password-input";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setIsSuccess(false);
    setIsSubmitting(true);

    const response = await fetch("/api/users/me/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setFieldErrors(body?.details?.fieldErrors ?? {});
      setFormError(body?.error ?? "Failed to change password.");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setIsSuccess(true);
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 px-6 py-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Change password
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField
          label="Current password"
          htmlFor="currentPassword"
          error={fieldErrors.currentPassword?.[0]}
        >
          <PasswordInput
            id="currentPassword"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
        </FormField>

        <FormField label="New password" htmlFor="newPassword" error={fieldErrors.newPassword?.[0]}>
          <PasswordInput
            id="newPassword"
            autoComplete="new-password"
            required
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </FormField>

        <FormField
          label="Confirm new password"
          htmlFor="confirmPassword"
          error={fieldErrors.confirmPassword?.[0]}
        >
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </FormField>

        {formError ? (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {formError}
          </p>
        ) : null}

        {isSuccess ? (
          <p role="status" className="text-sm text-green-600 dark:text-green-400">
            Password changed successfully.
          </p>
        ) : null}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Change password"}
        </Button>
      </form>
    </div>
  );
}
