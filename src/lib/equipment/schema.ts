import { z } from "zod";
import { equipmentStatusEnum } from "@/db/schema";

export const equipmentStatusValues = equipmentStatusEnum.enumValues;

const name = z.string().trim().min(1, "Name is required").max(200);
const code = z.string().trim().min(1, "Code is required").max(50);
const categoryId = z.string().uuid("Invalid category id").nullable().optional();
const location = z.string().trim().min(1).max(200).nullable().optional();
const status = z.enum(equipmentStatusValues);
const purchaseDate = z.coerce.date().nullable().optional();
const notes = z.string().trim().min(1).nullable().optional();

export const createEquipmentSchema = z.object({
  name,
  code,
  categoryId,
  location,
  status: status.optional(),
  purchaseDate,
  notes,
});

export const updateEquipmentSchema = z
  .object({
    name: name.optional(),
    code: code.optional(),
    categoryId,
    location,
    status: status.optional(),
    purchaseDate,
    notes,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const equipmentListQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  status: status.optional(),
  categoryId: z.string().uuid("Invalid category id").optional(),
});

export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;
export type UpdateEquipmentInput = z.infer<typeof updateEquipmentSchema>;
export type EquipmentListQuery = z.infer<typeof equipmentListQuerySchema>;
