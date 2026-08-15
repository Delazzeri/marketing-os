import { z } from "zod";

export type ColumnType = "text" | "status" | "date" | "link" | "person";

export const textValueSchema = z.string();
export type TextValue = z.infer<typeof textValueSchema>;

export const statusValueSchema = z.string();
export type StatusValue = z.infer<typeof statusValueSchema>;

export const dateValueSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato esperado: YYYY-MM-DD");
export type DateValue = z.infer<typeof dateValueSchema>;

export const linkValueSchema = z.object({
  url: z.string().url(),
  label: z.string().optional(),
});
export type LinkValue = z.infer<typeof linkValueSchema>;

export const personValueSchema = z.object({
  userId: z.string().uuid(),
});
export type PersonValue = z.infer<typeof personValueSchema>;
