"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { inviteMemberFieldsSchema } from "@/lib/validation/workspace-members";

export type InviteMemberFormState = { error?: string };

/**
 * Cosmetic invite (per the Nocturne redesign's confirmed scope): grabs an
 * existing auth.users row by email and adds it to workspace_members. Does
 * NOT create a new account or send an email — there's no signup/invite
 * flow in this app yet. "Leitor" role doesn't exist in workspace_role
 * (only owner/member) so the UI maps it to member; see TeamPanel.tsx.
 */
export async function inviteMember(
  workspaceId: number,
  _prevState: InviteMemberFormState,
  formData: FormData,
): Promise<InviteMemberFormState> {
  const supabase = await createClient();

  let fields;
  try {
    fields = inviteMemberFieldsSchema.parse({ email: formData.get("email") });
  } catch {
    return { error: "Email inválido." };
  }

  const service = createServiceClient();
  const { data: usersPage, error: listError } = await service.auth.admin.listUsers({ perPage: 1000 });
  if (listError) return { error: "Não foi possível buscar usuários." };

  const targetUser = usersPage.users.find(
    (user) => user.email?.toLowerCase() === fields.email.toLowerCase(),
  );
  if (!targetUser) {
    return { error: "Nenhuma conta encontrada com esse email. A pessoa precisa já ter uma conta." };
  }

  const { data: existingMembership } = await supabase
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", targetUser.id)
    .maybeSingle();
  if (existingMembership) return { error: "Essa pessoa já faz parte do workspace." };

  const { error: insertError } = await supabase.from("workspace_members").insert({
    workspace_id: workspaceId,
    user_id: targetUser.id,
    role: "member",
  });
  if (insertError) return { error: insertError.message };

  revalidatePath("/[workspaceSlug]/settings", "page");
  return {};
}

export async function removeMember(membershipId: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("workspace_members").delete().eq("id", membershipId);
  if (error) throw new Error(error.message);
  revalidatePath("/[workspaceSlug]/settings", "page");
}
