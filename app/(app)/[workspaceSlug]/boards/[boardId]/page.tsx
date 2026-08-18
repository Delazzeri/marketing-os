import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BoardHeader } from "@/components/boards/BoardHeader";
import { CreateGroupForm } from "@/components/boards/CreateGroupForm";
import { BoardViewSwitcher } from "@/components/boards/BoardViewSwitcher";
import { PortalTokenPanel } from "@/components/portal/PortalTokenPanel";
import { AutomationsPanel } from "@/components/automations/AutomationsPanel";
import { BoardSettingsDialog } from "@/components/boards/BoardSettingsDialog";
import { computeOverdueItemIds } from "@/lib/automations/overdue";
import { getWorkspaceMembersWithEmail } from "@/lib/supabase/user-lookup";
import { avatarColorFor } from "@/lib/avatar-color";
import { getCurrentUserContext } from "@/lib/auth/roles";
import { canWrite, canManageTeam as computeCanManageTeam } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Zap, Link2 } from "lucide-react";
import type { ColumnType } from "@/lib/column-types/schemas";
import type { DashboardWidgetType } from "@/lib/validation/dashboards";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; boardId: string }>;
}) {
  const { workspaceSlug, boardId } = await params;
  const supabase = await createClient();

  const { data: board } = await supabase
    .from("boards")
    .select("id, name, workspace_id, icon, item_column_width")
    .eq("id", boardId)
    .single();

  if (!board) notFound();

  const [{ data: groups }, { data: items }, { data: columns }, { data: overdueAutomation }, { data: dashboards }] =
    await Promise.all([
      supabase
        .from("groups")
        .select("id, name, color")
        .eq("board_id", board.id)
        .order("position", { ascending: true }),
      supabase
        .from("items")
        .select("id, title, group_id, values")
        .eq("board_id", board.id)
        .order("position", { ascending: true }),
      supabase.from("columns").select("id, name, type, config").eq("board_id", board.id).order("position", { ascending: true }),
      supabase
        .from("automations")
        .select("action_config")
        .eq("board_id", board.id)
        .eq("action_type", "mark_overdue")
        .eq("enabled", true)
        .maybeSingle(),
      supabase
        .from("dashboards")
        .select("id, name, dashboard_widgets(id, type, config)")
        .eq("board_id", board.id)
        .order("position", { ascending: true }),
    ]);

  const members = await getWorkspaceMembersWithEmail(board.workspace_id as number);

  const { isAdmin, workspaceRole: currentUserRole } = await getCurrentUserContext(board.workspace_id as number);
  const canEdit = canWrite(currentUserRole, isAdmin);
  const canManageTeam = computeCanManageTeam(currentUserRole, isAdmin);

  const boardColumns = (columns ?? []).map((column) => ({
    id: column.id,
    name: column.name,
    type: column.type as ColumnType,
    config:
      column.type === "person" || column.type === "people"
        ? { ...(column.config as Record<string, unknown>), members }
        : ((column.config ?? {}) as Record<string, unknown>),
  }));

  const boardItems = (items ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    groupId: item.group_id as number,
    values: (item.values ?? {}) as Record<string, unknown>,
  }));

  const dateColumn = boardColumns.find((column) => column.type === "date");

  const boardDashboards = (dashboards ?? []).map((dashboard) => ({ id: dashboard.id, name: dashboard.name }));
  const boardWidgets = (dashboards ?? []).flatMap((dashboard) =>
    (dashboard.dashboard_widgets ?? []).map((widget) => ({
      id: widget.id,
      dashboardId: dashboard.id,
      type: widget.type as DashboardWidgetType,
      config: (widget.config ?? {}) as { title?: string; columnId?: number; [key: string]: unknown },
    })),
  );

  const overdueDateColumnId = (overdueAutomation?.action_config as { dateColumnId?: number } | null)
    ?.dateColumnId;
  const overdueItemIds = computeOverdueItemIds(boardItems, overdueDateColumnId);

  const rawBoardLogo = board.icon as string | null;
  const boardLogo = rawBoardLogo?.startsWith("http") ? rawBoardLogo : null;

  return (
    <div className="mx-auto flex w-full max-w-[110rem] flex-col gap-6 px-6 py-8 lg:px-10 xl:px-14">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/${workspaceSlug}`}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: boardLogo ? undefined : avatarColorFor(board.name) }}
          >
            {boardLogo ? (
              <Image src={boardLogo} alt="" width={32} height={32} className="h-full w-full object-cover" />
            ) : (
              board.name.slice(0, 1).toUpperCase()
            )}
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">{board.name}</h1>
        </div>
        <BoardHeader
          workspaceId={board.workspace_id as number}
          members={members}
          currentUserRole={currentUserRole}
          isAdmin={isAdmin}
          canEdit={canEdit}
          canManageTeam={canManageTeam}
        />
      </div>

      <BoardViewSwitcher
        boardId={board.id}
        workspaceSlug={workspaceSlug}
        groups={groups ?? []}
        columns={boardColumns}
        items={boardItems}
        overdueItemIds={overdueItemIds}
        dateColumn={dateColumn}
        dashboards={boardDashboards}
        widgets={boardWidgets}
        itemColumnWidth={board.item_column_width as number | null}
        canEdit={canEdit}
      />

      {canEdit && (
        <div className="flex flex-wrap items-center gap-2">
          <CreateGroupForm boardId={board.id} />
        </div>
      )}

      {canEdit && (
        <div className="flex items-center justify-end gap-1 border-t border-border pt-3">
          <BoardSettingsDialog
            title="Automações"
            trigger={
              <Button type="button" variant="ghost" size="sm" className="text-muted-foreground">
                <Zap />
                Automações
              </Button>
            }
          >
            <AutomationsPanel
              boardId={board.id}
              workspaceId={board.workspace_id as number}
              columns={boardColumns}
              groups={groups ?? []}
            />
          </BoardSettingsDialog>

          <BoardSettingsDialog
            title="Portal do cliente"
            trigger={
              <Button type="button" variant="ghost" size="sm" className="text-muted-foreground">
                <Link2 />
                Portal do cliente
              </Button>
            }
          >
            <PortalTokenPanel boardId={board.id} />
          </BoardSettingsDialog>
        </div>
      )}
    </div>
  );
}
