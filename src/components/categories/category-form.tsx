"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/form-controls";

export type CategoryFormValues = {
  id: string;
  name: string;
};

export function CategoryForm({ category }: { category?: CategoryFormValues }) {
  const router = useRouter();
  const isEditing = !!category;

  const [name, setName] = useState(category?.name ?? "");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    const response = await fetch(
      isEditing ? `/api/categories/${category.id}` : "/api/categories",
      {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      },
    );

    setIsSubmitting(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setFieldErrors(body?.details?.fieldErrors ?? {});
      setFormError(body?.error ?? "Failed to save category.");
      return;
    }

    router.push("/admin/categories");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormField label="Name" htmlFor="name" error={fieldErrors.name?.[0]}>
        <Input
          id="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </FormField>

      {formError ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {formError}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : isEditing ? "Save changes" : "Create category"}
        </Button>
      </div>
    </form>
  );
}
