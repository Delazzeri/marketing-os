import { z } from "zod";
import type { ColumnType } from "@/lib/column-types/schemas";

export const columnTypeSchema = z.enum(["text", "status", "date", "link", "person"]) satisfies z.ZodType<ColumnType>;

export const statusOptionSchema = z.object({
  label: z.string().min(1),
  color: z.string().min(1),
});

const baseColumnFieldsSchema = z.object({
  name: z.string().min(1, "Obrigatório"),
  type: columnTypeSchema,
});

export const columnFieldsSchema = z
  .object({
    ...baseColumnFieldsSchema.shape,
    statusOptions: z.array(statusOptionSchema).optional(),
  })
  .refine(
    (fields) => fields.type !== "status" || (fields.statusOptions && fields.statusOptions.length > 0),
    { message: "Adicione ao menos uma opção de status", path: ["statusOptions"] },
  );

export type ColumnFields = z.infer<typeof columnFieldsSchema>;
