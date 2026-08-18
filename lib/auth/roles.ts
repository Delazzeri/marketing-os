import { createClient } from "@/lib/supabase/server";
import type { WorkspaceRole } from "@/lib/roles";

export interface UserContext {
  userId: string | null;
  isAdmin: boolean;
  workspaceRole: WorkspaceRole | null;
}

// Server-only helper: resolves whether the current user is a global admin
// and, if a workspaceId is given, their role within that workspace. Mirrors
// what the RLS helpers (private.is_admin/is_workspace_member/...) already
// enforce at the database level — this exists purely so pages/actions can
// make UX decisions (hide a button, return a friendly error) without
// re-deriving the same query by hand each time.
export async function getCurrentUserContext(workspaceId?: number): Promise<UserContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { userId: null, isAdmin: false, workspaceRole: null };

  const { data: adminRow } = await supabase.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  const isAdmin = Boolean(adminRow);

  let workspaceRole: WorkspaceRole | null = null;
  if (workspaceId !== undefined) {
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle();
    workspaceRole = (membership?.role as WorkspaceRole | undefined) ?? null;
  }

  return { userId: user.id, isAdmin, workspaceRole };
}
