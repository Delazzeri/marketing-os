"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { widgetFieldsSchema, type DashboardWidgetType } from "@/lib/validation/dashboards";

export async function addWidget(boardId: number, type: DashboardWidgetType, config: Record<string, unknown>) {
  const supabase = await createClient();

  const parsed = widgetFieldsSchema.safeParse({ type, config });
  if (!parsed.success) throw new Error("Configuração de widget inválida.");

  const { data, error } = await supabase
    .from("dashboard_widgets")
    .insert({
      board_id: boardId,
      type: parsed.data.type,
      config: parsed.data.config,
    })
    .select("id, type, config")
    .single();
  if (error) throw new Error(error.message);

  revalidatePath("/[workspaceSlug]/boards/[boardId]", "page");
  return data;
}

export async function updateWidgetConfig(widgetId: number, config: Record<string, unknown>) {
  const supabase = await createClient();
  const { error } = await supabase.from("dashboard_widgets").update({ config }).eq("id", widgetId);
  if (error) throw new Error(error.message);
  revalidatePath("/[workspaceSlug]/boards/[boardId]", "page");
}

export async function deleteWidget(widgetId: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("dashboard_widgets").delete().eq("id", widgetId);
  if (error) throw new Error(error.message);
  revalidatePath("/[workspaceSlug]/boards/[boardId]", "page");
}

export async function reorderWidgets(orderedWidgetIds: number[]) {
  const supabase = await createClient();
  await Promise.all(
    orderedWidgetIds.map((id, index) =>
      supabase.from("dashboard_widgets").update({ position: index }).eq("id", id),
    ),
  );
  revalidatePath("/[workspaceSlug]/boards/[boardId]", "page");
}
