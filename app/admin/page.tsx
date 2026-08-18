import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUserContext } from "@/lib/auth/roles";
import { createServiceClient } from "@/lib/supabase/service";
import { CreateWorkspaceForm } from "@/components/admin/CreateWorkspaceForm";
import { CreateUserForm } from "@/components/admin/CreateUserForm";
import { EditUserCredentialsForm } from "@/components/admin/EditUserCredentialsForm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS, type WorkspaceRole } from "@/lib/roles";
import { LayoutGrid } from "lucide-react";

export default async function AdminPage() {
  const { isAdmin } = await getCurrentUserContext();
  if (!isAdmin) notFound();

  const service = createServiceClient();

  const [{ data: workspaces }, { data: memberships }, usersPage] = await Promise.all([
    service.from("workspaces").select("id, name, slug").order("name", { ascending: true }),
    service.from("workspace_members").select("id, workspace_id, user_id, role"),
    service.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const usersById = new Map(usersPage.data.users.map((u) => [u.id, u]));

  const membershipsByWorkspace = new Map<number, typeof memberships>();
  for (const membership of memberships ?? []) {
    const list = membershipsByWorkspace.get(membership.workspace_id as number) ?? [];
    list.push(membership);
    membershipsByWorkspace.set(membership.workspace_id as number, list);
  }

  const workspaceOptions = (workspaces ?? []).map((w) => ({ id: w.id, name: w.name }));

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Administração</h1>
        <div className="flex gap-2">
          <CreateUserForm workspaces={workspaceOptions} />
          <CreateWorkspaceForm />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-muted-foreground">Empresas</h2>
        {(workspaces ?? []).map((workspace) => {
          const workspaceMemberships = membershipsByWorkspace.get(workspace.id) ?? [];
          return (
            <Card key={workspace.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <LayoutGrid className="h-4 w-4" />
                  </div>
                  <CardTitle>{workspace.name}</CardTitle>
                </div>
                <Link href={`/${workspace.slug}`} className="text-sm text-primary hover:underline">
                  Entrar
                </Link>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {workspaceMemberships.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhuma pessoa nesta empresa ainda.</p>
                )}
                {workspaceMemberships.map((membership) => {
                  const user = usersById.get(membership.user_id as string);
                  const email = user?.email ?? "—";
                  return (
                    <div key={membership.id} className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2">
                      <span className="flex-1 text-sm">{email}</span>
                      <Badge variant="secondary">{ROLE_LABELS[membership.role as WorkspaceRole]}</Badge>
                      <EditUserCredentialsForm userId={membership.user_id as string} currentEmail={email} />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
        {(workspaces ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma empresa ainda.</p>
        )}
      </div>
    </div>
  );
}
