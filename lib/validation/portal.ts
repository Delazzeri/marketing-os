import { z } from "zod";

export const portalTokenFieldsSchema = z.object({
  expiresAt: z
    .string()
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export type PortalTokenFields = z.infer<typeof portalTokenFieldsSchema>;
