import { z } from "zod";

export const notifyAssigneeConfigSchema = z.object({
  statusColumnId: z.coerce.number().int().positive(),
  assigneeColumnId: z.coerce.number().int().positive(),
});

export const dueDatePassedConfigSchema = z.object({
  dateColumnId: z.coerce.number().int().positive(),
});

export const showInPortalUpdateConfigSchema = z.object({
  statusColumnId: z.coerce.number().int().positive(),
  toValue: z.string().min(1, "Obrigatório"),
});

export const itemCreatedConfigSchema = z.object({
  groupId: z.coerce.number().int().positive(),
  assigneeColumnId: z.coerce.number().int().positive(),
  defaultUserId: z.string().uuid(),
});
