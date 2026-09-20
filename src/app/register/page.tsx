"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Button, buttonClasses } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/form-controls";
import { PasswordInput } from "@/components/ui/password-input";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, confirmPassword }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setFieldErrors(body?.details?.fieldErrors ?? {});
      setFormError(body?.error ?? "Failed to register.");
      return;
    }

    setIsSubmitted(true);
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-canvas px-4 py-10">
      <div className="flex items-center gap-2.5">
        <span aria-hidden="true" className="h-[30px] w-[30px] rounded-control bg-accent" />
        <span className="text-lg font-semibold text-ink">Maintenance</span>
      </div>

      <div className="w-full max-w-[400px] rounded-dialog border border-border bg-surface p-7 shadow-card">
        {isSubmitted ? (
          <div className="flex flex-col gap-4">
            <h1 className="text-[22px] font-semibold text-ink">Registration submitted</h1>
            <Alert tone="info">
              Your account is waiting for admin approval. You can sign in once it is approved.
            </Alert>
            <Link href="/login" className={`${buttonClasses("secondary")} w-full`}>
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-[22px] font-semibold text-ink">Create account</h1>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              {formError ? <Alert tone="danger">{formError}</Alert> : null}

              <FormField label="Name" htmlFor="name" error={fieldErrors.name?.[0]}>
                <Input
                  id="name"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </FormField>

              <FormField label="Email" htmlFor="email" error={fieldErrors.email?.[0]}>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </FormField>

              <FormField label="Password" htmlFor="password" error={fieldErrors.password?.[0]}>
                <PasswordInput
                  id="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </FormField>

              <FormField
                label="Confirm password"
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

              <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
                {isSubmitting ? "Submitting..." : "Create account"}
              </Button>

              <p className="text-center text-[13px] text-muted">
                Already registered?{" "}
                <Link href="/login" className="font-medium text-accent hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
