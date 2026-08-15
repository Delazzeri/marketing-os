"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  dueDatePassedConfigSchema,
  itemCreatedConfigSchema,
  notifyAssigneeConfigSchema,
  showInPortalUpdateConfigSchema,
} from "@/lib/validation/automations";
import type { AutomationActionType, AutomationTriggerType } from "@/lib/types";

export type AutomationFormState = { error?: string };

const configSchemaByActionType: Record<AutomationActionType, (formData: FormData) => object> = {
  notify_assignee: (formData) =>
    notifyAssigneeConfigSchema.parse({
      statusColumnId: formData.get("statusColumnId"),
      assigneeColumnId: formData.get("assigneeColumnId"),
    }),
  mark_overdue: (formData) =>
    dueDatePassedConfigSchema.parse({ dateColumnId: formData.get("dateColumnId") }),
  show_in_portal_update: (formData) =>
    showInPortalUpdateConfigSchema.parse({
      statusColumnId: formData.get("statusColumnId"),
      toValue: formData.get("toValue"),
    }),
  set_default_assignee: (formData) =>
    itemCreatedConfigSchema.parse({
      groupId: formData.get("groupId"),
      assigneeColumnId: formData.get("assigneeColumnId"),
      defaultUserId: formData.get("defaultUserId"),
    }),
};

const triggerTypeByActionType: Record<AutomationActionType, AutomationTriggerType> = {
  notify_assignee: "status_changed",
  mark_overdue: "due_date_passed",
  show_in_portal_update: "status_changed",
  set_default_assignee: "item_created",
};

export async function upsertAutomation(
  boardId: number,
  actionType: AutomationActionType,
  _prevState: AutomationFormState,
  formData: FormData,
): Promise<AutomationFormState> {
  const supabase = await createClient();

  let actionConfig;
  try {
    actionConfig = configSchemaByActionType[actionType](formData);
  } catch {
    return { error: "Confira os campos obrigatórios." };
  }

  const triggerType = triggerTypeByActionType[actionType];

  const { data: existing } = await supabase
    .from("automations")
    .select("id")
    .eq("board_id", boardId)
    .eq("action_type", actionType)
    .maybeSingle();

  const { error } = existing
    ? await supabase
        .from("automations")
        .update({ action_config: actionConfig, trigger_config: {}, enabled: true })
        .eq("id", existing.id)
    : await supabase.from("automations").insert({
        board_id: boardId,
        trigger_type: triggerType,
        trigger_config: {},
        action_type: actionType,
        action_config: actionConfig,
        enabled: true,
      });

  if (error) return { error: error.message };

  revalidatePath("/[workspaceSlug]/boards/[boardId]", "page");
  return {};
}

export async function toggleAutomation(automationId: number, enabled: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("automations")
    .update({ enabled })
    .eq("id", automationId);

  if (error) throw new Error(error.message);
  revalidatePath("/[workspaceSlug]/boards/[boardId]", "page");
}

type AutomationRow = {
  id: number;
  trigger_type: AutomationTriggerType;
  trigger_config: Record<string, unknown>;
  action_type: AutomationActionType;
  action_config: Record<string, unknown>;
  enabled: boolean;
};

type AutomationContext = {
  itemId: number;
  itemTitle?: string;
  groupId?: number;
  columnId?: number;
  previousValue?: unknown;
  newValue?: unknown;
  itemValues?: Record<string, unknown>;
  workspaceSlug?: string;
};

// Synchronous execution engine — called inline from the Server Actions that
// cause each trigger (createItem, updateItemValue). No cron/queue involved;
// mark_overdue is intentionally never dispatched here (it's computed at
// read time, see lib/automations/overdue.ts).
export async function runAutomations(
  boardId: number,
  triggerType: AutomationTriggerType,
  context: AutomationContext,
) {
  const supabase = await createClient();

  const { data: automations } = await supabase
    .from("automations")
    .select("id, trigger_type, trigger_config, action_type, action_config, enabled")
    .eq("board_id", boardId)
    .eq("trigger_type", triggerType)
    .eq("enabled", true);

  for (const automation of (automations ?? []) as AutomationRow[]) {
    if (automation.action_type === "notify_assignee") {
      await runNotifyAssignee(supabase, boardId, automation, context);
    } else if (automation.action_type === "show_in_portal_update") {
      await runShowInPortalUpdate(supabase, automation, context);
    } else if (automation.action_type === "set_default_assignee") {
      await runSetDefaultAssignee(supabase, automation, context);
    }
    // mark_overdue: no-op, handled at read time only.
  }
}

async function runNotifyAssignee(
  supabase: Awaited<ReturnType<typeof createClient>>,
  boardId: number,
  automation: AutomationRow,
  context: AutomationContext,
) {
  const config = automation.action_config as { statusColumnId?: number; assigneeColumnId?: number };
  if (config.statusColumnId !== context.columnId) return;
  if (!config.assigneeColumnId || !context.itemValues) return;

  const assigneeValue = context.itemValues[config.assigneeColumnId] as { userId?: string } | undefined;
  if (!assigneeValue?.userId) return;

  await supabase.from("notifications").insert({
    user_id: assigneeValue.userId,
    type: "assignee_notified",
    payload: {
      boardId,
      itemId: context.itemId,
      itemTitle: context.itemTitle ?? "",
      workspaceSlug: context.workspaceSlug ?? "",
    },
  });
}

async function runShowInPortalUpdate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  automation: AutomationRow,
  context: AutomationContext,
) {
  const config = automation.action_config as { statusColumnId?: number; toValue?: string };
  if (config.statusColumnId !== context.columnId) return;
  if (config.toValue === undefined || context.newValue !== config.toValue) return;

  await supabase.from("item_updates").insert({
    item_id: context.itemId,
    author_id: null,
    body: `Status alterado para "${config.toValue}".`,
    mentioned_user_ids: [],
  });
}

async function runSetDefaultAssignee(
  supabase: Awaited<ReturnType<typeof createClient>>,
  automation: AutomationRow,
  context: AutomationContext,
) {
  const config = automation.action_config as {
    groupId?: number;
    assigneeColumnId?: number;
    defaultUserId?: string;
  };
  if (config.groupId !== context.groupId) return;
  if (!config.assigneeColumnId || !config.defaultUserId) return;

  const { data: item } = await supabase
    .from("items")
    .select("values")
    .eq("id", context.itemId)
    .single();
  if (!item) return;

  const nextValues = { ...(item.values as Record<string, unknown>) };
  nextValues[config.assigneeColumnId] = { userId: config.defaultUserId };

  await supabase.from("items").update({ values: nextValues }).eq("id", context.itemId);
}
