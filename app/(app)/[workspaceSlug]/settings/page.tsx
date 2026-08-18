import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentUserContext } from "@/lib/auth/roles";
import { canManageTeam as computeCanManageTeam } from "@/lib/roles";
import { TeamPanel } from "@/components/team/TeamPanel";
import type { WorkspaceRole } from "@/lib/roles";

function nameFromEmail(email: string | null | undefined): string {
  if (!email) return "Usuário";
  return email.split("@")[0];
}

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const supabase = await createClient();

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name")
    .eq("slug", workspaceSlug)
    .single();

  if (!workspace) notFound();

  const { isAdmin, workspaceRole } = await getCurrentUserContext(workspace.id);

  const { data: memberships } = await supabase
    .from("workspace_members")
    .select("id, user_id, role")
    .eq("workspace_id", workspace.id);

  const service = createServiceClient();
  const members = await Promise.all(
    (memberships ?? []).map(async (membership) => {
      const { data } = await service.auth.admin.getUserById(membership.user_id as string);
      return {
        membershipId: membership.id,
        userId: membership.user_id as string,
        name: nameFromEmail(data.user?.email),
        role: membership.role as WorkspaceRole,
      };
    }),
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Configurações — {workspace.name}</h1>
      <TeamPanel
        workspaceId={workspace.id}
        members={members}
        canManageTeam={computeCanManageTeam(workspaceRole, isAdmin)}
      />
    </div>
  );
}
