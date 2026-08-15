"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { itemUpdateFieldsSchema } from "@/lib/validation/item-updates";

export type ItemUpdateFormState = { error?: string };

export async function createItemUpdate(
  itemId: number,
  _prevState: ItemUpdateFormState,
  formData: FormData,
): Promise<ItemUpdateFormState> {
  const supabase = await createClient();

  const mentionedRaw = formData.get("mentionedUserIds");
  let mentionedUserIds: unknown;
  try {
    mentionedUserIds = mentionedRaw ? JSON.parse(String(mentionedRaw)) : [];
  } catch {
    return { error: "Menções inválidas." };
  }

  let fields;
  try {
    fields = itemUpdateFieldsSchema.parse({
      body: formData.get("body"),
      mentionedUserIds,
    });
  } catch {
    return { error: "Confira os campos obrigatórios." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error: insertError } = await supabase.from("item_updates").insert({
    item_id: itemId,
    author_id: user?.id,
    body: fields.body,
    mentioned_user_ids: fields.mentionedUserIds,
  });

  if (insertError) return { error: insertError.message };

  revalidatePath("/[workspaceSlug]/boards/[boardId]/items/[itemId]", "page");
  return {};
}

export async function deleteItemUpdate(updateId: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("item_updates").delete().eq("id", updateId);
  if (error) throw new Error(error.message);
  revalidatePath("/[workspaceSlug]/boards/[boardId]/items/[itemId]", "page");
}
