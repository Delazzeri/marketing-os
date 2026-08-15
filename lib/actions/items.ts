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

export async function deleteItem(itemId: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("items").delete().eq("id", itemId);
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
