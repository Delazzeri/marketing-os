import { z } from "zod";

export const slugSchema = z
  .string()
  .min(1, "Obrigatório")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use apenas letras minúsculas, números e hífens");

export const boardFieldsSchema = z.object({
  name: z.string().min(1, "Obrigatório"),
  slug: slugSchema,
});

export type BoardFields = z.infer<typeof boardFieldsSchema>;

export const groupFieldsSchema = z.object({
  name: z.string().min(1, "Obrigatório"),
  color: z.string().optional(),
});

export type GroupFields = z.infer<typeof groupFieldsSchema>;

export const itemFieldsSchema = z.object({
  title: z.string().min(1, "Obrigatório"),
  groupId: z.coerce.number().int().positive(),
});

export type ItemFields = z.infer<typeof itemFieldsSchema>;
