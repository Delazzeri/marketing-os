"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { groupFieldsSchema, itemFieldsSchema } from "@/lib/validation/boards";
import { runAutomations } from "@/lib/actions/automations";

export type GroupFormState = { error?: string };
export type ItemFormState = { error?: string };

export async function createGroup(
  boardId: number,
  _prevState: GroupFormState,
  formData: FormData,
): Promise<GroupFormState> {
  const supabase = await createClient();

  let fields;
  try {
    fields = groupFieldsSchema.parse({
      name: formData.get("name"),
      color: formData.get("color") || undefined,
    });
  } catch {
    return { error: "Confira os campos obrigatórios." };
  }

  const { error: insertError } = await supabase.from("groups").insert({
    board_id: boardId,
    name: fields.name,
    color: fields.color ?? null,
  });

  if (insertError) return { error: insertError.message };

  revalidatePath("/[workspaceSlug]/boards/[boardId]", "page");
  return {};
}

export async function deleteGroup(groupId: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("groups").delete().eq("id", groupId);
  if (error) throw new Error(error.message);
  revalidatePath("/[workspaceSlug]/boards/[boardId]", "page");
}

export async function renameGroup(groupId: number, name: string) {
  const supabase = await createClient();
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("Nome obrigatório.");
  const { error } = await supabase.from("groups").update({ name: trimmedName }).eq("id", groupId);
  if (error) throw new Error(error.message);
  revalidatePath("/[workspaceSlug]/boards/[boardId]", "page");
}

export async function setGroupColor(groupId: number, color: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("groups").update({ color }).eq("id", groupId);
  if (error) throw new Error(error.message);
  revalidatePath("/[workspaceSlug]/boards/[boardId]", "page");
}

export async function reorderGroups(orderedGroupIds: number[]) {
  const supabase = await createClient();

  await Promise.all(
    orderedGroupIds.map((id, index) => supabase.from("groups").update({ position: index }).eq("id", id)),
  );

  revalidatePath("/[workspaceSlug]/boards/[boardId]", "page");
}

export async function createItem(
  boardId: number,
  _prevState: ItemFormState,
  formData: FormData,
): Promise<ItemFormState> {
  const supabase = await createClient();

  let fields;
  try {
    fields = itemFieldsSchema.parse({
      title: formData.get("title"),
      groupId: formData.get("groupId"),
    });
  } catch {
    return { error: "Confira os campos obrigatórios." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: newItem, error: insertError } = await supabase
    .from("items")
    .insert({
      board_id: boardId,
      group_id: fields.groupId,
      title: fields.title,
      created_by: user?.id,
    })
    .select("id")
    .single();

  if (insertError) return { error: insertError.message };

  await runAutomations(boardId, "item_created", {
    itemId: newItem.id,
    groupId: fields.groupId,
  });

  revalidatePath("/[workspaceSlug]/boards/[boardId]", "page");
  return {};
}

/**
 * Quick-add used by CalendarView's double-click-on-empty-cell affordance:
 * creates the item in the board's first group (calendar has no group
 * concept of its own) and immediately stamps the clicked day onto the date
 * column, so the item appears back on that cell without a second step.
 */
export async function quickCreateItemWithDate(
  boardId: number,
  groupId: number,
  title: string,
  dateColumnId: number,
  isoDate: string,
) {
  const supabase = await createClient();
  const trimmedTitle = title.trim();
  if (!trimmedTitle) throw new Error("Título obrigatório.");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: newItem, error: insertError } = await supabase
    .from("items")
    .insert({
      board_id: boardId,
      group_id: groupId,
      title: trimmedTitle,
      created_by: user?.id,
      values: { [dateColumnId]: isoDate },
    })
    .select("id")
    .single();

  if (insertError) throw new Error(insertError.message);

  await runAutomations(boardId, "item_created", {
    itemId: newItem.id,
    groupId,
  });

  revalidatePath("/[workspaceSlug]/boards/[boardId]", "page");
  return newItem.id as number;
}

export async function deleteItem(itemId: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("items").delete().eq("id", itemId);
  if (error) throw new Error(error.message);
  revalidatePath("/[workspaceSlug]/boards/[boardId]", "page");
}

export async function deleteItems(itemIds: number[]) {
  if (itemIds.length === 0) return;
  const supabase = await createClient();
  const { error } = await supabase.from("items").delete().in("id", itemIds);
  if (error) throw new Error(error.message);
  revalidatePath("/[workspaceSlug]/boards/[boardId]", "page");
}

export async function reorderItems(orderedItemIds: number[]) {
  const supabase = await createClient();

  await Promise.all(
    orderedItemIds.map((id, index) =>
      supabase.from("items").update({ position: index }).eq("id", id),
    ),
  );

  revalidatePath("/[workspaceSlug]/boards/[boardId]", "page");
}
