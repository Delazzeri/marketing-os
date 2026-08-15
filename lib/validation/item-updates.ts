import { z } from "zod";

export const itemUpdateFieldsSchema = z.object({
  body: z.string().min(1, "Obrigatório"),
  mentionedUserIds: z.array(z.string().uuid()).default([]),
});

export type ItemUpdateFields = z.infer<typeof itemUpdateFieldsSchema>;
