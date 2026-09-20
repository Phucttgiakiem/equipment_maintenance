"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Button, buttonClasses } from "@/components/ui/button";
import { CARD_CLASSES } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-controls";
import { PageContainer, PageHeader } from "@/components/ui/page";
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
    <PageContainer>
      <PageHeader
        title="Change password"
        description="Choose a new password for your own account."
      />

      <div className={`max-w-[480px] p-6 ${CARD_CLASSES}`}>
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
            <p className="text-xs text-muted">Same rules as at sign-up.</p>
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

          {formError ? <Alert tone="danger">{formError}</Alert> : null}
          {isSuccess ? (
            <p role="status" className="text-sm text-[#17602B] dark:text-[#8FD6A0]">
              Password changed successfully.
            </p>
          ) : null}

          <div className="flex items-center gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save password"}
            </Button>
            <Link href="/" className={buttonClasses("secondary")}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}
