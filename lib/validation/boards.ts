import { z } from "zod";

export const slugSchema = z
  .string()
  .min(1, "Obrigatório")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use apenas letras minúsculas, números e hífens");

export const boardTypeSchema = z.enum(["standard", "whiteboard"]);
export type BoardType = z.infer<typeof boardTypeSchema>;

export const boardFieldsSchema = z.object({
  name: z.string().min(1, "Obrigatório"),
  slug: slugSchema,
  icon: z.string().optional(),
  color: z.string().optional(),
});

export type BoardFields = z.infer<typeof boardFieldsSchema>;

export const quickCreateBoardFieldsSchema = z.object({
  name: z.string().min(1, "Obrigatório"),
  type: boardTypeSchema.default("standard"),
});

export type QuickCreateBoardFields = z.infer<typeof quickCreateBoardFieldsSchema>;

export const VIEW_KINDS = ["table", "calendar", "kanban", "dashboard"] as const;
export type ViewKind = (typeof VIEW_KINDS)[number];

export const viewOrderSchema = z
  .array(z.enum(VIEW_KINDS))
  .refine(
    (order) => order.length === VIEW_KINDS.length && new Set(order).size === VIEW_KINDS.length,
    "Ordem inválida.",
  );

export const folderFieldsSchema = z.object({
  name: z.string().min(1, "Obrigatório"),
  color: z.string().optional(),
});

export type FolderFields = z.infer<typeof folderFieldsSchema>;

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
