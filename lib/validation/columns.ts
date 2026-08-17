import { z } from "zod";
import type { ColumnType } from "@/lib/column-types/schemas";

export const columnTypeSchema = z.enum([
  "text",
  "status",
  "date",
  "link",
  "person",
  "format",
  "people",
  "number",
  "select",
  "check",
  "whatsapp",
]) satisfies z.ZodType<ColumnType>;

// Column types whose config is a list of { label, color } options, edited via
// the same StatusOptionsEditor UI (status/format/select all share this shape).
export const OPTION_BASED_COLUMN_TYPES = ["status", "format", "select"] as const;

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
    (fields) =>
      !(OPTION_BASED_COLUMN_TYPES as readonly string[]).includes(fields.type) ||
      (fields.statusOptions && fields.statusOptions.length > 0),
    { message: "Adicione ao menos uma opção", path: ["statusOptions"] },
  );

export type ColumnFields = z.infer<typeof columnFieldsSchema>;
