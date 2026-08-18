"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { noteColorSchema, noteTextSchema, notePositionSchema } from "@/lib/validation/whiteboard";

export async function createNote(boardId: number, position: { x: number; y: number }) {
  const supabase = await createClient();
  const parsedPosition = notePositionSchema.parse(position);
  const { data, error } = await supabase
    .from("whiteboard_notes")
    .insert({ board_id: boardId, position_x: parsedPosition.x, position_y: parsedPosition.y })
    .select("id, text, color, position_x, position_y")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/[workspaceSlug]/boards/[boardId]", "page");
  return data;
}

export async function updateNoteText(noteId: number, text: string) {
  const supabase = await createClient();
  const parsedText = noteTextSchema.parse(text);
  const { error } = await supabase.from("whiteboard_notes").update({ text: parsedText }).eq("id", noteId);
  if (error) throw new Error(error.message);
  revalidatePath("/[workspaceSlug]/boards/[boardId]", "page");
}

export async function updateNotePosition(noteId: number, position: { x: number; y: number }) {
  const supabase = await createClient();
  const parsedPosition = notePositionSchema.parse(position);
  const { error } = await supabase
    .from("whiteboard_notes")
    .update({ position_x: parsedPosition.x, position_y: parsedPosition.y })
    .eq("id", noteId);
  if (error) throw new Error(error.message);
  revalidatePath("/[workspaceSlug]/boards/[boardId]", "page");
}

export async function setNoteColor(noteId: number, color: string) {
  const supabase = await createClient();
  const parsedColor = noteColorSchema.parse(color);
  const { error } = await supabase.from("whiteboard_notes").update({ color: parsedColor }).eq("id", noteId);
  if (error) throw new Error(error.message);
  revalidatePath("/[workspaceSlug]/boards/[boardId]", "page");
}

export async function deleteNote(noteId: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("whiteboard_notes").delete().eq("id", noteId);
  if (error) throw new Error(error.message);
  revalidatePath("/[workspaceSlug]/boards/[boardId]", "page");
}

export async function createConnection(boardId: number, fromNoteId: number, toNoteId: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("whiteboard_connections")
    .insert({ board_id: boardId, from_note_id: fromNoteId, to_note_id: toNoteId });
  if (error) throw new Error(error.message);
  revalidatePath("/[workspaceSlug]/boards/[boardId]", "page");
}

export async function deleteConnection(connectionId: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("whiteboard_connections").delete().eq("id", connectionId);
  if (error) throw new Error(error.message);
  revalidatePath("/[workspaceSlug]/boards/[boardId]", "page");
}
