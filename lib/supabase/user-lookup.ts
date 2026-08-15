import { createServiceClient } from "@/lib/supabase/service";
import type { WorkspaceMember } from "@/lib/types";

function nameFromEmail(email: string | null | undefined): string {
  if (!email) return "Usuário";
  return email.split("@")[0];
}

// Resolves display names for workspace members via auth.users (no profiles
// table exists in the schema). Server-only, uses the service client since
// the authenticated/RLS client cannot read auth.users directly.
export async function getWorkspaceMembersWithEmail(
  workspaceId: number,
): Promise<WorkspaceMember[]> {
  const service = createServiceClient();

  const { data: members } = await service
    .from("workspace_members")
    .select("user_id")
    .eq("workspace_id", workspaceId);

  if (!members || members.length === 0) return [];

  const userIds = members.map((m) => m.user_id as string);

  // auth.users isn't exposed over PostgREST — the Admin API is the
  // supported way to read it with the service-role key.
  const results = await Promise.all(
    userIds.map((userId) => service.auth.admin.getUserById(userId)),
  );

  return userIds.map((userId, index) => ({
    userId,
    name: nameFromEmail(results[index].data.user?.email),
    avatarUrl: null,
  }));
}
