"use client";

import { useState } from "react";
import { BoardViewSwitcher } from "@/components/boards/BoardViewSwitcher";
import { CreateGroupForm } from "@/components/boards/CreateGroupForm";
import type { ColumnType } from "@/lib/column-types/schemas";
import type { ViewKind } from "@/lib/validation/boards";
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

interface WidgetData {
  id: number;
  type: DashboardWidgetType;
  config: { title?: string; columnId?: number; [key: string]: unknown };
}

// CreateGroupForm lives outside BoardViewSwitcher's tree in the page layout
// (always visible under the view tabs, not just in the Tabela view), so
// group state has to be owned here, one level up, for creating a group to
// show up immediately instead of waiting on router.refresh() + a full
// page re-fetch.
export function BoardWorkspace({
  boardId,
  workspaceSlug,
  groups: initialGroups,
  columns,
  items,
  overdueItemIds,
  dateColumn,
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
  widgets: WidgetData[];
  viewOrder: ViewKind[];
  itemColumnWidth?: number | null;
  canEdit?: boolean;
}) {
  const [groups, setGroups] = useState(initialGroups);
  const [prevInitialGroups, setPrevInitialGroups] = useState(initialGroups);
  if (initialGroups !== prevInitialGroups) {
    setPrevInitialGroups(initialGroups);
    setGroups(initialGroups);
  }

  function handleGroupCreated(group: GroupData) {
    setGroups((current) => (current.some((g) => g.id === group.id) ? current : [...current, group]));
  }

  return (
    <>
      <BoardViewSwitcher
        boardId={boardId}
        workspaceSlug={workspaceSlug}
        groups={groups}
        columns={columns}
        items={items}
        overdueItemIds={overdueItemIds}
        dateColumn={dateColumn}
        widgets={widgets}
        viewOrder={viewOrder}
        itemColumnWidth={itemColumnWidth}
        canEdit={canEdit}
      />

      {canEdit && (
        <div className="flex flex-wrap items-center gap-2">
          <CreateGroupForm boardId={boardId} onCreated={handleGroupCreated} />
        </div>
      )}
    </>
  );
}
