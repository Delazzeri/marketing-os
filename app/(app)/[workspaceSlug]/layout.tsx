import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { GuidedTour } from "@/components/onboarding/GuidedTour";
import { GUIDED_TOUR_COOKIE } from "@/lib/guided-tour";
import { createClient } from "@/lib/supabase/server";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { getCurrentUserContext } from "@/lib/auth/roles";
import { canWrite } from "@/lib/roles";
import type { AppNotification } from "@/lib/types";
import type { BoardType } from "@/lib/validation/boards";
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

  const { isAdmin, workspaceRole } = await getCurrentUserContext(workspace.id);
  const canEdit = canWrite(workspaceRole, isAdmin);

  const [{ data: boards }, { data: folders }, { data: notifications }] = await Promise.all([
    supabase
      .from("boards")
      .select("id, name, icon, color, folder_id, type")
      .eq("workspace_id", workspace.id)
      .order("position", { ascending: true }),
    supabase
      .from("board_folders")
      .select("id, name, color")
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

  // Onboarding tour (see signIn): only resolved when the cookie is present,
  // so regular sessions pay for no extra query. The tour walks through a
  // board, so pick the first one in sidebar order that has items to show.
  const showGuidedTour = (await cookies()).get(GUIDED_TOUR_COOKIE)?.value === "1";
  let guidedTourBoardId: number | null = null;
  if (showGuidedTour) {
    const standardBoardIds = (boards ?? [])
      .filter((board) => (board.type as BoardType) !== "whiteboard")
      .map((board) => board.id as number);
    if (standardBoardIds.length > 0) {
      const { data: boardsWithItems } = await supabase
        .from("items")
        .select("board_id")
        .in("board_id", standardBoardIds)
        .limit(500);
      const withItems = new Set((boardsWithItems ?? []).map((row) => row.board_id as number));
      guidedTourBoardId = standardBoardIds.find((id) => withItems.has(id)) ?? standardBoardIds[0];
    }
  }

  const boardSummaries = (boards ?? []).map((board) => ({
    id: board.id,
    name: board.name,
    icon: board.icon as string | null,
    color: board.color as string | null,
    folderId: board.folder_id as number | null,
    type: board.type as BoardType,
  }));

  return (
    <SidebarProvider>
      <AppSidebar
        workspaceSlug={workspaceSlug}
        workspaceName={workspace.name}
        boards={boardSummaries}
        folders={folders ?? []}
        isAdmin={isAdmin}
        canEdit={canEdit}
      />
      <SidebarInset>
        <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <SidebarTrigger />
          {user && (
            <div data-tour="notifications">
              <NotificationBell
                userId={user.id}
                notifications={(notifications ?? []) as unknown as AppNotification[]}
              />
            </div>
          )}
        </header>
        {children}
      </SidebarInset>
      {showGuidedTour && <GuidedTour workspaceSlug={workspaceSlug} boardId={guidedTourBoardId} />}
    </SidebarProvider>
  );
}
