"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { columnFieldsSchema, OPTION_BASED_COLUMN_TYPES } from "@/lib/validation/columns";
import { columnValueSchemaRegistry, type ColumnType } from "@/lib/column-types/registry.server";
import { runAutomations } from "@/lib/actions/automations";

export type ColumnFormState = { error?: string };

// PostgREST returns nested relations as an object when resolved from the
// "many" side's .single() (items -> boards) but the exact shape isn't
// guaranteed without generated types, so this normalizes either an object
// or a single-element array before drilling into workspaces.slug.
function extractWorkspaceSlug(boardsRelation: unknown): string | undefined {
  const board = Array.isArray(boardsRelation) ? boardsRelation[0] : boardsRelation;
  if (!board || typeof board !== "object") return undefined;
  const workspaces = (board as { workspaces?: unknown }).workspaces;
  const workspace = Array.isArray(workspaces) ? workspaces[0] : workspaces;
  if (!workspace || typeof workspace !== "object") return undefined;
  const slug = (workspace as { slug?: unknown }).slug;
  return typeof slug === "string" ? slug : undefined;
}

export async function createColumn(
  boardId: number,
  _prevState: ColumnFormState,
  formData: FormData,
): Promise<ColumnFormState> {
  const supabase = await createClient();

  const statusOptionsRaw = formData.get("statusOptions");
  let statusOptions: unknown;
  try {
    statusOptions = statusOptionsRaw ? JSON.parse(String(statusOptionsRaw)) : undefined;
  } catch {
    return { error: "Opções de status inválidas." };
  }

  let fields;
  try {
    fields = columnFieldsSchema.parse({
      name: formData.get("name"),
      type: formData.get("type"),
      statusOptions,
    });
  } catch {
    return { error: "Confira os campos obrigatórios." };
  }

  const config = (OPTION_BASED_COLUMN_TYPES as readonly string[]).includes(fields.type)
    ? { options: fields.statusOptions }
    : {};

  const { error: insertError } = await supabase.from("columns").insert({
    board_id: boardId,
    name: fields.name,
    type: fields.type,
    config,
  });

  if (insertError) return { error: insertError.message };

  revalidatePath("/[workspaceSlug]/boards/[boardId]", "page");
  return {};
}

export async function updateItemValue(itemId: number, columnId: number, rawValue: unknown) {
  const supabase = await createClient();

  const { data: column } = await supabase
    .from("columns")
    .select("type")
    .eq("id", columnId)
    .single();

  if (!column) throw new Error("Coluna não encontrada.");

  const schema = columnValueSchemaRegistry[column.type as ColumnType];

  const value = rawValue === null ? null : schema.parse(rawValue);

  const { data: item } = await supabase
    .from("items")
    .select("values, board_id, title, boards(workspaces(slug))")
    .eq("id", itemId)
    .single();
  if (!item) throw new Error("Item não encontrado.");

  const workspaceSlug = extractWorkspaceSlug(item.boards);

  const previousValues = item.values as Record<string, unknown>;
  const previousValue = previousValues[columnId];

  const nextValues = { ...previousValues };
  if (value === null) {
    delete nextValues[columnId];
  } else {
    nextValues[columnId] = value;
  }

  const { error: updateError } = await supabase
    .from("items")
    .update({ values: nextValues })
    .eq("id", itemId);

  if (updateError) throw new Error(updateError.message);

  if (column.type === "status") {
    await runAutomations(item.board_id as number, "status_changed", {
      itemId,
      itemTitle: item.title as string,
      columnId,
      previousValue,
      newValue: value,
      itemValues: nextValues,
      workspaceSlug,
    });
  }

  revalidatePath("/[workspaceSlug]/boards/[boardId]", "page");
  revalidatePath("/[workspaceSlug]/boards/[boardId]/items/[itemId]", "page");
}

export async function deleteColumn(columnId: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("columns").delete().eq("id", columnId);
  if (error) throw new Error(error.message);
  revalidatePath("/[workspaceSlug]/boards/[boardId]", "page");
}

export async function renameColumn(columnId: number, name: string) {
  const supabase = await createClient();
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("Nome obrigatório.");
  const { error } = await supabase.from("columns").update({ name: trimmedName }).eq("id", columnId);
  if (error) throw new Error(error.message);
  revalidatePath("/[workspaceSlug]/boards/[boardId]", "page");
}

// Changing a column's type can make every item's stored value for it
// incompatible with the new type's schema (e.g. a status column's plain
// string value vs. a link column's {url,label} object), so this clears
// values[columnId] across all of the board's items whenever the type
// actually changes — better an empty cell than a value the new type's
// renderer/editor can't parse. When the type is unchanged, this only
// updates config (e.g. status/format/select option edits) and never
// touches item values.
export async function changeColumnType(
  boardId: number,
  columnId: number,
  type: string,
  statusOptions?: { label: string; color: string }[],
) {
  const supabase = await createClient();

  const parsedType = columnFieldsSchema.shape.type.parse(type);
  const isOptionBased = (OPTION_BASED_COLUMN_TYPES as readonly string[]).includes(parsedType);
  const config = isOptionBased ? { options: statusOptions ?? [] } : {};

  const { data: existing } = await supabase.from("columns").select("type").eq("id", columnId).single();
  if (!existing) throw new Error("Coluna não encontrada.");

  const typeChanged = existing.type !== parsedType;

  const { error: updateError } = await supabase
    .from("columns")
    .update(typeChanged || isOptionBased ? { type: parsedType, config } : { type: parsedType })
    .eq("id", columnId);
  if (updateError) throw new Error(updateError.message);

  if (typeChanged) {
    const { data: items } = await supabase
      .from("items")
      .select("id, values")
      .eq("board_id", boardId)
      .not("values", "eq", "{}");

    await Promise.all(
      (items ?? [])
        .filter((item) => columnId in (item.values as Record<string, unknown>))
        .map((item) => {
          const values = { ...(item.values as Record<string, unknown>) };
          delete values[columnId];
          return supabase.from("items").update({ values }).eq("id", item.id);
        }),
    );
  }

  revalidatePath("/[workspaceSlug]/boards/[boardId]", "page");
}

export async function setColumnWidth(columnId: number, width: number) {
  const supabase = await createClient();
  const { data: column } = await supabase.from("columns").select("config").eq("id", columnId).single();
  if (!column) throw new Error("Coluna não encontrada.");
  const config = { ...(column.config as Record<string, unknown>), width };
  const { error } = await supabase.from("columns").update({ config }).eq("id", columnId);
  if (error) throw new Error(error.message);
  revalidatePath("/[workspaceSlug]/boards/[boardId]", "page");
}

export async function reorderColumns(orderedColumnIds: number[]) {
  const supabase = await createClient();

  await Promise.all(
    orderedColumnIds.map((id, index) =>
      supabase.from("columns").update({ position: index }).eq("id", id),
    ),
  );

  revalidatePath("/[workspaceSlug]/boards/[boardId]", "page");
}
