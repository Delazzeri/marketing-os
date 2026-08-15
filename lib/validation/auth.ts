import { z } from "zod";

export const signInFieldsSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Obrigatório"),
});

export type SignInFields = z.infer<typeof signInFieldsSchema>;
