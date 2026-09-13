import { z } from "zod";
import { registrationStatusEnum, userRoleEnum } from "@/db/schema";

export const registrationStatusValues = registrationStatusEnum.enumValues;
export const userRoleValues = userRoleEnum.enumValues;

/**
 * `.strict()` rejects a client-supplied `role` (or any other extra field)
 * with a 400 instead of silently dropping it — the only mechanism blocking
 * self-registration from creating an admin account (REQUIREMENTS.md §3).
 */
export const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(120),
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(8, "Password must be at least 8 characters"),
  })
  .strict();

export const userListQuerySchema = z.object({
  registrationStatus: z.enum(registrationStatusValues).optional(),
  role: z.enum(userRoleValues).optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});

export const changeRoleSchema = z
  .object({
    role: z.enum(userRoleValues),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type UserListQuery = z.infer<typeof userListQuerySchema>;
export type ChangeRoleInput = z.infer<typeof changeRoleSchema>;
