"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { boardFieldsSchema } from "@/lib/validation/boards";

export type BoardFormState = { error?: string };

function parseFields(formData: FormData) {
  return boardFieldsSchema.parse({
    name: formData.get("name"),
    slug: formData.get("slug"),
  });
}

export async function createBoard(
  workspaceSlug: string,
  _prevState: BoardFormState,
  formData: FormData,
): Promise<BoardFormState> {
  const supabase = await createClient();

  let fields;
  try {
    fields = parseFields(formData);
  } catch {
    return { error: "Confira os campos obrigatórios." };
  }

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id")
    .eq("slug", workspaceSlug)
    .single();

  if (workspaceError || !workspace) {
    return { error: "Workspace não encontrado." };
  }

  const { error: insertError } = await supabase.from("boards").insert({
    workspace_id: workspace.id,
    name: fields.name,
    slug: fields.slug,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return { error: "Já existe um board com esse identificador neste workspace." };
    }
    return { error: insertError.message };
  }

  revalidatePath("/[workspaceSlug]", "page");
  return {};
}
