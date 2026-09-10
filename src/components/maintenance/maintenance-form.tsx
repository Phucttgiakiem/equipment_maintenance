"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { FormField, Input, Select, Textarea } from "@/components/ui/form-controls";
import {
  maintenanceStatusValues,
  maintenanceTypeValues,
} from "@/lib/maintenance/schema";

type MaintenanceStatus = (typeof maintenanceStatusValues)[number];
type MaintenanceType = (typeof maintenanceTypeValues)[number];

export type MaintenanceRecordValues = {
  id: string;
  technicianId: string | null;
  type: MaintenanceType;
  status: MaintenanceStatus;
  scheduledDate: Date;
  completedDate: Date | null;
  description: string;
  notes: string | null;
};

type Technician = { id: string; name: string };

type MaintenanceFormProps =
  | { mode: "create"; equipmentId: string; technicians: Technician[]; record?: undefined }
  | { mode: "edit-full"; equipmentId: string; technicians: Technician[]; record: MaintenanceRecordValues }
  | { mode: "edit-self"; equipmentId?: undefined; technicians?: undefined; record: MaintenanceRecordValues };

function toDateInputValue(date: Date | null) {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export function MaintenanceForm(props: MaintenanceFormProps) {
  const router = useRouter();
  const record = props.mode === "create" ? undefined : props.record;
  const canEditAllFields = props.mode === "create" || props.mode === "edit-full";

  const [technicianId, setTechnicianId] = useState(record?.technicianId ?? "");
  const [type, setType] = useState<MaintenanceType>(record?.type ?? "preventive");
  const [status, setStatus] = useState<MaintenanceStatus>(record?.status ?? "scheduled");
  const [scheduledDate, setScheduledDate] = useState(
    toDateInputValue(record?.scheduledDate ?? null),
  );
  const [completedDate, setCompletedDate] = useState(
    toDateInputValue(record?.completedDate ?? null),
  );
  const [description, setDescription] = useState(record?.description ?? "");
  const [notes, setNotes] = useState(record?.notes ?? "");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    const payload =
      props.mode === "create"
        ? {
            equipmentId: props.equipmentId,
            technicianId: technicianId || null,
            type,
            status,
            scheduledDate,
            completedDate: completedDate || null,
            description,
            notes: notes || null,
          }
        : canEditAllFields
          ? {
              technicianId: technicianId || null,
              type,
              status,
              scheduledDate,
              completedDate: completedDate || null,
              description,
              notes: notes || null,
            }
          : {
              status,
              completedDate: completedDate || null,
              notes: notes || null,
            };

    const url =
      props.mode === "create" ? "/api/maintenance" : `/api/maintenance/${props.record.id}`;
    const method = props.mode === "create" ? "POST" : "PATCH";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setFieldErrors(body?.details?.fieldErrors ?? {});
      setFormError(body?.error ?? "Failed to save maintenance record.");
      return;
    }

    const { data } = await response.json();
    router.push(
      props.mode === "create" ? `/equipment/${props.equipmentId}` : `/maintenance/${data.id}`,
    );
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormField label="Description" htmlFor="description" error={fieldErrors.description?.[0]}>
        <Textarea
          id="description"
          rows={3}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          disabled={!canEditAllFields}
          required={canEditAllFields}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Type" htmlFor="type" error={fieldErrors.type?.[0]}>
          <Select
            id="type"
            value={type}
            onChange={(event) => setType(event.target.value as MaintenanceType)}
            disabled={!canEditAllFields}
          >
            {maintenanceTypeValues.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Technician" htmlFor="technicianId" error={fieldErrors.technicianId?.[0]}>
          <Select
            id="technicianId"
            value={technicianId}
            onChange={(event) => setTechnicianId(event.target.value)}
            disabled={!canEditAllFields}
          >
            <option value="">Unassigned</option>
            {props.technicians?.map((technician) => (
              <option key={technician.id} value={technician.id}>
                {technician.name}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Scheduled date" htmlFor="scheduledDate" error={fieldErrors.scheduledDate?.[0]}>
          <Input
            id="scheduledDate"
            type="date"
            value={scheduledDate}
            onChange={(event) => setScheduledDate(event.target.value)}
            disabled={!canEditAllFields}
            required={canEditAllFields}
          />
        </FormField>

        <FormField label="Completed date" htmlFor="completedDate" error={fieldErrors.completedDate?.[0]}>
          <Input
            id="completedDate"
            type="date"
            value={completedDate}
            onChange={(event) => setCompletedDate(event.target.value)}
          />
        </FormField>
      </div>

      <FormField label="Status" htmlFor="status" error={fieldErrors.status?.[0]}>
        <Select
          id="status"
          value={status}
          onChange={(event) => setStatus(event.target.value as MaintenanceStatus)}
        >
          {maintenanceStatusValues.map((value) => (
            <option key={value} value={value}>
              {value.replace(/_/g, " ")}
            </option>
          ))}
        </Select>
      </FormField>

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
          {isSubmitting
            ? "Saving..."
            : props.mode === "create"
              ? "Create maintenance record"
              : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
