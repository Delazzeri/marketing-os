"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { itemAttachmentFieldsSchema } from "@/lib/validation/item-attachments";

export type ItemAttachmentFormState = { error?: string };

export async function createItemAttachment(
  itemId: number,
  _prevState: ItemAttachmentFormState,
  formData: FormData,
): Promise<ItemAttachmentFormState> {
  const supabase = await createClient();

  let fields;
  try {
    fields = itemAttachmentFieldsSchema.parse({
      fileUrl: formData.get("fileUrl"),
      fileName: formData.get("fileName"),
    });
  } catch {
    return { error: "Confira os campos obrigatórios." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error: insertError } = await supabase.from("item_attachments").insert({
    item_id: itemId,
    file_url: fields.fileUrl,
    file_name: fields.fileName,
    uploaded_by: user?.id,
  });

  if (insertError) return { error: insertError.message };

  revalidatePath("/[workspaceSlug]/boards/[boardId]/items/[itemId]", "page");
  return {};
}

export async function deleteItemAttachment(attachmentId: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("item_attachments").delete().eq("id", attachmentId);
  if (error) throw new Error(error.message);
  revalidatePath("/[workspaceSlug]/boards/[boardId]/items/[itemId]", "page");
}
