import { z } from "zod";
import { ASSIGNABLE_ROLES } from "@/lib/roles";

export const inviteMemberFieldsSchema = z.object({
  email: z.string().email("Email inválido"),
  role: z.enum(ASSIGNABLE_ROLES as unknown as [string, ...string[]]),
});

export type InviteMemberFields = z.infer<typeof inviteMemberFieldsSchema>;
