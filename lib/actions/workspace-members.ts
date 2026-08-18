"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentUserContext } from "@/lib/auth/roles";
import { canManageTeam } from "@/lib/roles";
import { inviteMemberFieldsSchema } from "@/lib/validation/workspace-members";

export type InviteMemberFormState = { error?: string };

/**
 * Grabs an existing auth.users row by email and adds it to
 * workspace_members with the chosen role. Does NOT create a new account or
 * send an email — account creation happens through the /admin panel
 * (lib/actions/admin.ts createUserAccount).
 */
export async function inviteMember(
  workspaceId: number,
  _prevState: InviteMemberFormState,
  formData: FormData,
): Promise<InviteMemberFormState> {
  const { isAdmin, workspaceRole } = await getCurrentUserContext(workspaceId);
  if (!canManageTeam(workspaceRole, isAdmin)) {
    return { error: "Você não tem permissão para gerenciar a equipe deste workspace." };
  }

  const supabase = await createClient();

  let fields;
  try {
    fields = inviteMemberFieldsSchema.parse({
      email: formData.get("email"),
      role: formData.get("role"),
    });
  } catch {
    return { error: "Confira os campos obrigatórios." };
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
    role: fields.role,
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
