import { z } from "zod";
import { slugSchema } from "@/lib/validation/boards";
import { ASSIGNABLE_ROLES } from "@/lib/roles";

export const createWorkspaceFieldsSchema = z.object({
  name: z.string().min(1, "Obrigatório"),
  slug: slugSchema,
});

export type CreateWorkspaceFields = z.infer<typeof createWorkspaceFieldsSchema>;

export const createUserFieldsSchema = z.object({
  name: z.string().min(1, "Obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo de 6 caracteres"),
  workspaceId: z.coerce.number().int().positive(),
  role: z.enum(ASSIGNABLE_ROLES as unknown as [string, ...string[]]),
});

export type CreateUserFields = z.infer<typeof createUserFieldsSchema>;

export const updateUserCredentialsFieldsSchema = z.object({
  email: z.string().email("Email inválido").optional(),
  password: z.string().min(6, "Mínimo de 6 caracteres").optional().or(z.literal("")),
});

export type UpdateUserCredentialsFields = z.infer<typeof updateUserCredentialsFieldsSchema>;
