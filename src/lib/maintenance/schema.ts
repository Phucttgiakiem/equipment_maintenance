import { z } from "zod";
import { maintenanceStatusEnum, maintenanceTypeEnum } from "@/db/schema";

export const maintenanceStatusValues = maintenanceStatusEnum.enumValues;
export const maintenanceTypeValues = maintenanceTypeEnum.enumValues;

const equipmentId = z.string().uuid("Invalid equipment id");
const technicianId = z.string().uuid("Invalid technician id").nullable();
const type = z.enum(maintenanceTypeValues);
const status = z.enum(maintenanceStatusValues);
const scheduledDate = z.coerce.date();
const completedDate = z.coerce.date().nullable().optional();
const description = z.string().trim().min(1, "Description is required");
const notes = z.string().trim().min(1).nullable().optional();

export const createMaintenanceSchema = z.object({
  equipmentId,
  technicianId: technicianId.optional(),
  type: type.optional(),
  status: status.optional(),
  scheduledDate,
  completedDate,
  description,
  notes,
});

export const updateMaintenanceSchema = z
  .object({
    equipmentId: equipmentId.optional(),
    technicianId: technicianId.optional(),
    type: type.optional(),
    status: status.optional(),
    scheduledDate: scheduledDate.optional(),
    completedDate,
    description: description.optional(),
    notes,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

/**
 * A technician may update status, completed date, and notes on a record
 * assigned to them, but not reassign it or change equipment/type/schedule
 * (admin-only, per REQUIREMENTS.md section 4). `.strict()` rejects any
 * other field instead of silently dropping it.
 */
export const technicianSelfUpdateSchema = z
  .object({
    status: status.optional(),
    completedDate,
    notes,
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const maintenanceListQuerySchema = z.object({
  equipmentId: z.string().uuid().optional(),
  status: status.optional(),
  technicianId: z.string().uuid().optional(),
});

export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;
export type UpdateMaintenanceInput = z.infer<typeof updateMaintenanceSchema>;
export type TechnicianSelfUpdateInput = z.infer<typeof technicianSelfUpdateSchema>;
export type MaintenanceListQuery = z.infer<typeof maintenanceListQuerySchema>;
