import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import type { AppNotification } from "@/lib/types";
import type { ReactNode } from "react";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode;
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: boards }, { data: notifications }] = await Promise.all([
    supabase
      .from("boards")
      .select("id, name")
      .eq("workspace_id", workspace.id)
      .order("position", { ascending: true }),
    user
      ? supabase
          .from("notifications")
          .select("id, user_id, type, payload, read, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <SidebarProvider>
      <AppSidebar workspaceSlug={workspaceSlug} workspaceName={workspace.name} boards={boards ?? []} />
      <SidebarInset>
        <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <SidebarTrigger />
          {user && (
            <NotificationBell
              userId={user.id}
              notifications={(notifications ?? []) as unknown as AppNotification[]}
            />
          )}
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
