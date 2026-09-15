"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
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
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Create an account
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Maintenance Management System
        </p>

        {isSubmitted ? (
          <div className="mt-6 flex flex-col gap-4">
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              Your registration has been submitted and is awaiting admin approval. You will
              be able to sign in once an admin approves your account.
            </p>
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-50"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
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

            {formError ? (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                {formError}
              </p>
            ) : null}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Register"}
            </Button>

            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-zinc-900 hover:underline dark:text-zinc-50">
                Sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
