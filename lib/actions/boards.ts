"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { boardFieldsSchema, folderFieldsSchema } from "@/lib/validation/boards";

export type BoardFormState = { error?: string };
export type FolderFormState = { error?: string };

function parseFields(formData: FormData) {
  return boardFieldsSchema.parse({
    name: formData.get("name"),
    slug: formData.get("slug"),
  });
}

function slugify(name: string) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

/**
 * Quick-create used by the sidebar "+ Quadro" affordance: takes only a name
 * and derives a unique slug (appending -2, -3... on collision), unlike
 * createBoard's full form which requires the user to choose a slug.
 */
export async function quickCreateBoard(workspaceSlug: string, name: string, folderId: number | null) {
  const supabase = await createClient();
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("Nome obrigatório.");

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id")
    .eq("slug", workspaceSlug)
    .single();
  if (workspaceError || !workspace) throw new Error("Workspace não encontrado.");

  const baseSlug = slugify(trimmedName) || "board";
  let slug = baseSlug;
  for (let attempt = 1; attempt <= 20; attempt++) {
    const { error: insertError } = await supabase.from("boards").insert({
      workspace_id: workspace.id,
      name: trimmedName,
      slug,
      folder_id: folderId,
    });
    if (!insertError) {
      revalidatePath("/[workspaceSlug]", "layout");
      return;
    }
    if (insertError.code !== "23505") throw new Error(insertError.message);
    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
  }
  throw new Error("Não foi possível gerar um identificador único.");
}

export async function renameBoard(boardId: number, name: string) {
  const supabase = await createClient();
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("Nome obrigatório.");
  const { error } = await supabase.from("boards").update({ name: trimmedName }).eq("id", boardId);
  if (error) throw new Error(error.message);
  revalidatePath("/[workspaceSlug]", "layout");
}

export async function setBoardIcon(boardId: number, icon: string | null) {
  const supabase = await createClient();
  const { error } = await supabase.from("boards").update({ icon }).eq("id", boardId);
  if (error) throw new Error(error.message);
  revalidatePath("/[workspaceSlug]", "layout");
}

export async function setItemColumnWidth(boardId: number, width: number) {
  const supabase = await createClient();
  const roundedWidth = Math.round(width);
  const { error } = await supabase.from("boards").update({ item_column_width: roundedWidth }).eq("id", boardId);
  if (error) throw new Error(error.message);
  revalidatePath("/[workspaceSlug]/boards/[boardId]", "page");
}

export async function moveBoardToFolder(boardId: number, folderId: number | null) {
  const supabase = await createClient();
  const { error } = await supabase.from("boards").update({ folder_id: folderId }).eq("id", boardId);
  if (error) throw new Error(error.message);
  revalidatePath("/[workspaceSlug]", "layout");
}

export async function reorderBoards(orderedBoardIds: number[]) {
  const supabase = await createClient();
  await Promise.all(
    orderedBoardIds.map((id, index) => supabase.from("boards").update({ position: index }).eq("id", id)),
  );
  revalidatePath("/[workspaceSlug]", "layout");
}

export async function deleteBoard(boardId: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("boards").delete().eq("id", boardId);
  if (error) throw new Error(error.message);
  revalidatePath("/[workspaceSlug]", "layout");
}

export async function createFolder(
  workspaceSlug: string,
  _prevState: FolderFormState,
  formData: FormData,
): Promise<FolderFormState> {
  const supabase = await createClient();

  let fields;
  try {
    fields = folderFieldsSchema.parse({
      name: formData.get("name"),
      color: formData.get("color") || undefined,
    });
  } catch {
    return { error: "Confira os campos obrigatórios." };
  }

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id")
    .eq("slug", workspaceSlug)
    .single();
  if (workspaceError || !workspace) return { error: "Workspace não encontrado." };

  const { error: insertError } = await supabase.from("board_folders").insert({
    workspace_id: workspace.id,
    name: fields.name,
    color: fields.color ?? null,
  });
  if (insertError) return { error: insertError.message };

  revalidatePath("/[workspaceSlug]", "layout");
  return {};
}

export async function renameFolder(folderId: number, name: string) {
  const supabase = await createClient();
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("Nome obrigatório.");
  const { error } = await supabase.from("board_folders").update({ name: trimmedName }).eq("id", folderId);
  if (error) throw new Error(error.message);
  revalidatePath("/[workspaceSlug]", "layout");
}

export async function setFolderColor(folderId: number, color: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("board_folders").update({ color }).eq("id", folderId);
  if (error) throw new Error(error.message);
  revalidatePath("/[workspaceSlug]", "layout");
}

export async function deleteFolder(folderId: number) {
  const supabase = await createClient();
  // Boards in this folder fall back to the top level rather than being
  // deleted (folder_id is nullable + on delete set null covers this at the
  // DB level too, this update just makes the intent explicit before the delete).
  await supabase.from("boards").update({ folder_id: null }).eq("folder_id", folderId);
  const { error } = await supabase.from("board_folders").delete().eq("id", folderId);
  if (error) throw new Error(error.message);
  revalidatePath("/[workspaceSlug]", "layout");
}

export async function reorderFolders(orderedFolderIds: number[]) {
  const supabase = await createClient();
  await Promise.all(
    orderedFolderIds.map((id, index) =>
      supabase.from("board_folders").update({ position: index }).eq("id", id),
    ),
  );
  revalidatePath("/[workspaceSlug]", "layout");
}
