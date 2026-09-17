import { z } from "zod";

const name = z.string().trim().min(1, "Name is required").max(100);

export const createCategorySchema = z.object({
  name,
});

export const updateCategorySchema = z.object({
  name,
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
