"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { dashboardFieldsSchema, widgetFieldsSchema, type DashboardWidgetType } from "@/lib/validation/dashboards";

export type DashboardFormState = { error?: string };

export async function createDashboard(
  boardId: number,
  _prevState: DashboardFormState,
  formData: FormData,
): Promise<DashboardFormState> {
  const supabase = await createClient();

  let fields;
  try {
    fields = dashboardFieldsSchema.parse({ name: formData.get("name") });
  } catch {
    return { error: "Confira os campos obrigatórios." };
  }

  const { error: insertError } = await supabase.from("dashboards").insert({
    board_id: boardId,
    name: fields.name,
  });
  if (insertError) return { error: insertError.message };

  revalidatePath("/[workspaceSlug]/boards/[boardId]", "page");
  return {};
}

export async function renameDashboard(dashboardId: number, name: string) {
  const supabase = await createClient();
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("Nome obrigatório.");
  const { error } = await supabase.from("dashboards").update({ name: trimmedName }).eq("id", dashboardId);
  if (error) throw new Error(error.message);
  revalidatePath("/[workspaceSlug]/boards/[boardId]", "page");
}

export async function deleteDashboard(dashboardId: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("dashboards").delete().eq("id", dashboardId);
  if (error) throw new Error(error.message);
  revalidatePath("/[workspaceSlug]/boards/[boardId]", "page");
}

export async function reorderDashboards(orderedDashboardIds: number[]) {
  const supabase = await createClient();
  await Promise.all(
    orderedDashboardIds.map((id, index) =>
      supabase.from("dashboards").update({ position: index }).eq("id", id),
    ),
  );
  revalidatePath("/[workspaceSlug]/boards/[boardId]", "page");
}

export async function addWidget(dashboardId: number, type: DashboardWidgetType, config: Record<string, unknown>) {
  const supabase = await createClient();

  const parsed = widgetFieldsSchema.safeParse({ type, config });
  if (!parsed.success) throw new Error("Configuração de widget inválida.");

  const { error } = await supabase.from("dashboard_widgets").insert({
    dashboard_id: dashboardId,
    type: parsed.data.type,
    config: parsed.data.config,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/[workspaceSlug]/boards/[boardId]", "page");
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
