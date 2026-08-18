import { z } from "zod";

export const welcomeLinkSchema = z.object({
  label: z.string().trim().min(1, "Rótulo obrigatório"),
  url: z.string().trim().url("URL inválida"),
});

export const welcomeFieldsSchema = z.object({
  message: z.string().trim().max(4000).optional().default(""),
  links: z.array(welcomeLinkSchema).max(20).default([]),
});

export type WelcomeLink = z.infer<typeof welcomeLinkSchema>;
export type WelcomeFields = z.infer<typeof welcomeFieldsSchema>;
