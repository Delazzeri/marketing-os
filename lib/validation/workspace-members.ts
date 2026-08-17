import { z } from "zod";

export const inviteMemberFieldsSchema = z.object({
  email: z.string().email("Email inválido"),
});

export type InviteMemberFields = z.infer<typeof inviteMemberFieldsSchema>;
