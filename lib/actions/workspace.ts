"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserContext } from "@/lib/auth/roles";
import { canManageTeam } from "@/lib/roles";
import { welcomeFieldsSchema } from "@/lib/validation/workspace";

export type WelcomeFormState = { error?: string };

export async function updateWorkspaceWelcome(
  workspaceId: number,
  _prevState: WelcomeFormState,
  formData: FormData,
): Promise<WelcomeFormState> {
  const { isAdmin, workspaceRole } = await getCurrentUserContext(workspaceId);
  if (!canManageTeam(workspaceRole, isAdmin)) {
    return { error: "Você não tem permissão para editar esta página." };
  }

  let fields;
  try {
    const rawLinks = formData.get("links");
    fields = welcomeFieldsSchema.parse({
      message: formData.get("message"),
      links: rawLinks ? JSON.parse(String(rawLinks)) : [],
    });
  } catch {
    return { error: "Confira os campos: links precisam de rótulo e URL válida." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("workspaces")
    .update({ welcome_message: fields.message, welcome_links: fields.links })
    .eq("id", workspaceId);
  if (error) return { error: error.message };

  revalidatePath("/[workspaceSlug]", "page");
  return {};
}
