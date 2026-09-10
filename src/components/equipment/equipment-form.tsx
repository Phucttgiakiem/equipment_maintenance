"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { FormField, Input, Select, Textarea } from "@/components/ui/form-controls";
import { equipmentStatusValues } from "@/lib/equipment/schema";

type EquipmentStatus = (typeof equipmentStatusValues)[number];

export type EquipmentFormValues = {
  id: string;
  name: string;
  code: string;
  category: string | null;
  location: string | null;
  status: EquipmentStatus;
  purchaseDate: Date | null;
  notes: string | null;
};

function toDateInputValue(date: Date | null) {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export function EquipmentForm({ equipment }: { equipment?: EquipmentFormValues }) {
  const router = useRouter();
  const isEditing = !!equipment;

  const [name, setName] = useState(equipment?.name ?? "");
  const [code, setCode] = useState(equipment?.code ?? "");
  const [category, setCategory] = useState(equipment?.category ?? "");
  const [location, setLocation] = useState(equipment?.location ?? "");
  const [status, setStatus] = useState<EquipmentStatus>(equipment?.status ?? "operational");
  const [purchaseDate, setPurchaseDate] = useState(
    toDateInputValue(equipment?.purchaseDate ?? null),
  );
  const [notes, setNotes] = useState(equipment?.notes ?? "");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    const payload = {
      name,
      code,
      category: category || null,
      location: location || null,
      status,
      purchaseDate: purchaseDate || null,
      notes: notes || null,
    };

    const response = await fetch(
      isEditing ? `/api/equipment/${equipment.id}` : "/api/equipment",
      {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    setIsSubmitting(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setFieldErrors(body?.details?.fieldErrors ?? {});
      setFormError(body?.error ?? "Failed to save equipment.");
      return;
    }

    router.push("/equipment");
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

      <FormField label="Code" htmlFor="code" error={fieldErrors.code?.[0]}>
        <Input
          id="code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          required
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Category" htmlFor="category" error={fieldErrors.category?.[0]}>
          <Input
            id="category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          />
        </FormField>

        <FormField label="Location" htmlFor="location" error={fieldErrors.location?.[0]}>
          <Input
            id="location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Status" htmlFor="status" error={fieldErrors.status?.[0]}>
          <Select
            id="status"
            value={status}
            onChange={(event) => setStatus(event.target.value as EquipmentStatus)}
          >
            {equipmentStatusValues.map((value) => (
              <option key={value} value={value}>
                {value.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          label="Purchase date"
          htmlFor="purchaseDate"
          error={fieldErrors.purchaseDate?.[0]}
        >
          <Input
            id="purchaseDate"
            type="date"
            value={purchaseDate}
            onChange={(event) => setPurchaseDate(event.target.value)}
          />
        </FormField>
      </div>

      <FormField label="Notes" htmlFor="notes" error={fieldErrors.notes?.[0]}>
        <Textarea
          id="notes"
          rows={4}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </FormField>

      {formError ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {formError}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : isEditing ? "Save changes" : "Create equipment"}
        </Button>
      </div>
    </form>
  );
}
