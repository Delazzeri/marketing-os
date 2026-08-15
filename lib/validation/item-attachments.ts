import { z } from "zod";

export const itemAttachmentFieldsSchema = z.object({
  fileUrl: z.string().url("URL inválida"),
  fileName: z.string().min(1, "Obrigatório"),
});

export type ItemAttachmentFields = z.infer<typeof itemAttachmentFieldsSchema>;
