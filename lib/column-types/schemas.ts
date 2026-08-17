import { z } from "zod";

export type ColumnType =
  | "text"
  | "status"
  | "date"
  | "link"
  | "person"
  | "format"
  | "people"
  | "number"
  | "select"
  | "check"
  | "whatsapp";

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

// "format" reuses status's shape (a label matched against config.options) but
// is kept as a distinct column type so its palette/labels don't mix with
// workflow-status automations.
export const formatValueSchema = z.string();
export type FormatValue = z.infer<typeof formatValueSchema>;

export const peopleValueSchema = z.object({
  userIds: z.array(z.string().uuid()),
});
export type PeopleValue = z.infer<typeof peopleValueSchema>;

export const numberValueSchema = z.number();
export type NumberValue = z.infer<typeof numberValueSchema>;

// General-purpose dropdown, same shape as status (label matched against
// config.options) but rendered with neutral chips, no workflow semantics.
export const selectValueSchema = z.string();
export type SelectValue = z.infer<typeof selectValueSchema>;

export const checkValueSchema = z.boolean();
export type CheckValue = z.infer<typeof checkValueSchema>;

export const whatsappValueSchema = z.object({
  groupName: z.string().optional(),
  phone: z.string().optional(),
  message: z.string().optional(),
});
export type WhatsappValue = z.infer<typeof whatsappValueSchema>;
