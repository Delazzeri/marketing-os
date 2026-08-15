import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateGroupForm } from "@/components/boards/CreateGroupForm";
import { DeleteGroupButton } from "@/components/boards/DeleteGroupButton";
import { CreateItemForm } from "@/components/items/CreateItemForm";
import { CreateColumnForm } from "@/components/columns/CreateColumnForm";
import { BoardTable } from "@/components/boards/BoardTable";
import { CalendarView } from "@/components/views/CalendarView";
import { ViewToggle } from "@/components/views/ViewToggle";
import { PortalTokenPanel } from "@/components/portal/PortalTokenPanel";
import { AutomationsPanel } from "@/components/automations/AutomationsPanel";
import { computeOverdueItemIds } from "@/lib/automations/overdue";
import { getWorkspaceMembersWithEmail } from "@/lib/supabase/user-lookup";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import type { ColumnType } from "@/lib/column-types/schemas";

export default async function BoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceSlug: string; boardId: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { workspaceSlug, boardId } = await params;
  const { view } = await searchParams;
  const supabase = await createClient();

  const { data: board } = await supabase
    .from("boards")
    .select("id, name, workspace_id")
    .eq("id", boardId)
    .single();

  if (!board) notFound();

  const [{ data: groups }, { data: items }, { data: columns }, { data: overdueAutomation }] =
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
    ]);

  const members = await getWorkspaceMembersWithEmail(board.workspace_id as number);

  const boardColumns = (columns ?? []).map((column) => ({
    id: column.id,
    name: column.name,
    type: column.type as ColumnType,
    config:
      column.type === "person"
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
  const showCalendar = view === "calendar" && dateColumn;

  const overdueDateColumnId = (overdueAutomation?.action_config as { dateColumnId?: number } | null)
    ?.dateColumnId;
  const overdueItemIds = computeOverdueItemIds(boardItems, overdueDateColumnId);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{board.name}</h1>
        <Link
          href={`/${workspaceSlug}`}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          voltar
        </Link>
      </div>

      <ViewToggle hasDateColumn={Boolean(dateColumn)} />

      {showCalendar ? (
        <CalendarView
          boardId={board.id}
          workspaceSlug={workspaceSlug}
          dateColumn={dateColumn}
          items={boardItems}
        />
      ) : (
        <div className="flex flex-col gap-8">
          {(groups ?? []).map((group) => {
            const groupItems = boardItems.filter((item) => item.groupId === group.id);

            return (
              <div key={group.id} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="h-4 w-1.5 rounded-full"
                    style={{ backgroundColor: group.color ?? "var(--color-muted-foreground)" }}
                  />
                  <h2 className="text-sm font-semibold">{group.name}</h2>
                  <Badge variant="secondary">{groupItems.length}</Badge>
                  <DeleteGroupButton groupId={group.id} />
                </div>

                <BoardTable
                  key={`${boardColumns.map((c) => c.id).join(",")}|${groupItems.map((i) => i.id).join(",")}`}
                  boardId={board.id}
                  workspaceSlug={workspaceSlug}
                  columns={boardColumns}
                  items={groupItems}
                  overdueItemIds={overdueItemIds}
                />

                <CreateItemForm boardId={board.id} groupId={group.id} />
              </div>
            );
          })}
          {(groups ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum grupo ainda.</p>
          )}
        </div>
      )}

      <CreateGroupForm boardId={board.id} />
      <CreateColumnForm boardId={board.id} />

      <Separator className="mt-4" />
      <div className="flex flex-col gap-6">
        <h2 className="text-sm font-semibold text-muted-foreground">Configurações do board</h2>
        <AutomationsPanel
          boardId={board.id}
          workspaceId={board.workspace_id as number}
          columns={boardColumns}
          groups={groups ?? []}
        />
        <PortalTokenPanel boardId={board.id} />
      </div>
    </div>
  );
}
