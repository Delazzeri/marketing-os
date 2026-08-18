"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentUserContext } from "@/lib/auth/roles";
import {
  createWorkspaceFieldsSchema,
  createUserFieldsSchema,
  updateUserCredentialsFieldsSchema,
} from "@/lib/validation/admin";

export type AdminFormState = { error?: string };

async function requireAdmin() {
  const { isAdmin } = await getCurrentUserContext();
  if (!isAdmin) throw new Error("Apenas administradores podem fazer isso.");
}

export async function createWorkspace(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const supabase = await createClient();

  let fields;
  try {
    fields = createWorkspaceFieldsSchema.parse({
      name: formData.get("name"),
      slug: formData.get("slug"),
    });
  } catch {
    return { error: "Confira os campos obrigatórios." };
  }

  const { error } = await supabase.from("workspaces").insert({ name: fields.name, slug: fields.slug });
  if (error) {
    if (error.code === "23505") return { error: "Já existe uma empresa com esse identificador." };
    return { error: error.message };
  }

  revalidatePath("/admin", "page");
  return {};
}

export async function createUserAccount(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();

  let fields;
  try {
    fields = createUserFieldsSchema.parse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      workspaceId: formData.get("workspaceId"),
      role: formData.get("role"),
    });
  } catch {
    return { error: "Confira os campos obrigatórios." };
  }

  const service = createServiceClient();
  const { data: created, error: createError } = await service.auth.admin.createUser({
    email: fields.email,
    password: fields.password,
    email_confirm: true,
    user_metadata: { name: fields.name },
  });
  if (createError) return { error: createError.message };

  const { error: membershipError } = await service.from("workspace_members").insert({
    workspace_id: fields.workspaceId,
    user_id: created.user.id,
    role: fields.role,
  });
  if (membershipError) return { error: membershipError.message };

  revalidatePath("/admin", "page");
  return {};
}

export async function updateUserCredentials(
  userId: string,
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();

  let fields;
  try {
    fields = updateUserCredentialsFieldsSchema.parse({
      email: formData.get("email") || undefined,
      password: formData.get("password") || undefined,
    });
  } catch {
    return { error: "Confira os campos." };
  }

  if (!fields.email && !fields.password) return { error: "Informe email e/ou senha." };

  const service = createServiceClient();
  const { error } = await service.auth.admin.updateUserById(userId, {
    ...(fields.email ? { email: fields.email } : {}),
    ...(fields.password ? { password: fields.password } : {}),
  });
  if (error) return { error: error.message };

  revalidatePath("/admin", "page");
  return {};
}

export async function setWorkspaceMemberRole(membershipId: number, role: string) {
  await requireAdmin();
  const service = createServiceClient();
  const { error } = await service.from("workspace_members").update({ role }).eq("id", membershipId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin", "page");
}

export async function removeWorkspaceMember(membershipId: number) {
  await requireAdmin();
  const service = createServiceClient();
  const { error } = await service.from("workspace_members").delete().eq("id", membershipId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin", "page");
}

export async function addUserToWorkspace(workspaceId: number, userId: string, role: string) {
  await requireAdmin();
  const service = createServiceClient();
  const { error } = await service
    .from("workspace_members")
    .insert({ workspace_id: workspaceId, user_id: userId, role });
  if (error) throw new Error(error.message);
  revalidatePath("/admin", "page");
}
