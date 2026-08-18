"use client";

import { useState, useTransition } from "react";
import { BoardContent } from "@/components/boards/BoardContent";
import { CalendarView } from "@/components/views/CalendarView";
import { DashboardView } from "@/components/views/DashboardView";
import { KanbanView } from "@/components/views/KanbanView";
import { ViewToggle } from "@/components/views/ViewToggle";
import { setBoardViewOrder } from "@/lib/actions/boards";
import { VIEW_KINDS, type ViewKind } from "@/lib/validation/boards";
import type { ColumnType } from "@/lib/column-types/schemas";
import type { WidgetColumnData, WidgetItemData } from "@/lib/dashboard-widgets/registry";
import type { DashboardWidgetType } from "@/lib/validation/dashboards";

interface ColumnData {
  id: number;
  name: string;
  type: ColumnType;
  config: Record<string, unknown>;
}

interface ItemData {
  id: number;
  title: string;
  groupId: number;
  values: Record<string, unknown>;
}

interface GroupData {
  id: number;
  name: string;
  color: string | null;
}

interface DashboardData {
  id: number;
  name: string;
}

interface WidgetData {
  id: number;
  dashboardId: number;
  type: DashboardWidgetType;
  config: { title?: string; columnId?: number; [key: string]: unknown };
}

// Everything the board page can show is fetched once on the server, so
// switching between Tabela/Calendário/Kanban/Dashboards is a pure client-side
// state change here — no router.push/URL round-trip re-hitting the server for
// data it already has. That round-trip was the "clicks take forever"
// complaint: ViewToggle used to push a ?view= search param, which re-ran the
// whole Server Component (5 parallel queries) just to flip a tab.
export function BoardViewSwitcher({
  boardId,
  workspaceSlug,
  groups,
  columns,
  items,
  overdueItemIds,
  dateColumn,
  dashboards,
  widgets,
  viewOrder,
  itemColumnWidth,
  canEdit = true,
}: {
  boardId: number;
  workspaceSlug: string;
  groups: GroupData[];
  columns: ColumnData[];
  items: ItemData[];
  overdueItemIds?: Set<number>;
  dateColumn: ColumnData | undefined;
  dashboards: DashboardData[];
  widgets: WidgetData[];
  viewOrder: ViewKind[];
  itemColumnWidth?: number | null;
  canEdit?: boolean;
}) {
  const [, startTransition] = useTransition();
  const [order, setOrder] = useState(viewOrder);
  const [prevViewOrder, setPrevViewOrder] = useState(viewOrder);
  if (viewOrder !== prevViewOrder) {
    setPrevViewOrder(viewOrder);
    setOrder(viewOrder);
  }
  const [view, setView] = useState<ViewKind>(order[0] ?? VIEW_KINDS[0]);

  function handleOrderChange(next: ViewKind[]) {
    setOrder(next);
    startTransition(() => setBoardViewOrder(boardId, next));
  }

  return (
    <>
      <ViewToggle
        hasDateColumn={Boolean(dateColumn)}
        order={order}
        onOrderChange={canEdit ? handleOrderChange : undefined}
        view={view}
        onViewChange={setView}
      />

      {view === "kanban" ? (
        <KanbanView groups={groups} columns={columns} items={items} canEdit={canEdit} />
      ) : view === "dashboard" ? (
        <DashboardView
          boardId={boardId}
          dashboards={dashboards}
          widgets={widgets}
          columns={columns as WidgetColumnData[]}
          items={items as WidgetItemData[]}
        />
      ) : view === "calendar" && dateColumn ? (
        <CalendarView
          boardId={boardId}
          workspaceSlug={workspaceSlug}
          dateColumn={dateColumn}
          items={items}
          groups={groups}
          columns={columns}
        />
      ) : (
        <BoardContent
          boardId={boardId}
          workspaceSlug={workspaceSlug}
          groups={groups}
          columns={columns}
          items={items}
          overdueItemIds={overdueItemIds}
          itemColumnWidth={itemColumnWidth}
          canEdit={canEdit}
        />
      )}
    </>
  );
}
