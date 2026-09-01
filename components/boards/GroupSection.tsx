"use client";

import { useState, useTransition } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { renameGroup, setGroupColor } from "@/lib/actions/items";
import { BoardTable } from "@/components/boards/BoardTable";
import { CreateItemForm } from "@/components/items/CreateItemForm";
import { DeleteGroupButton } from "@/components/boards/DeleteGroupButton";
import { InlineEditableText } from "@/components/layout/InlineEditableText";
import { ColorSwatchPicker } from "@/components/columns/ColorSwatchPicker";
import { COLOR_PALETTE } from "@/lib/column-types/color-palette";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, GripVertical } from "lucide-react";
import type { ColumnType } from "@/lib/column-types/schemas";

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

// Assumes any status column option literally named "Concluído" means done —
// same heuristic lib/dashboard-widgets/battery.tsx uses, since there's no
// separate "done" flag on status options in the schema.
const DONE_LABEL = "Concluído";

function GroupFooterProgress({ items, statusColumn }: { items: ItemData[]; statusColumn: ColumnData | undefined }) {
  if (!statusColumn || items.length === 0) return null;
  const options = (statusColumn.config.options as { label: string; color: string }[] | undefined) ?? [];
  if (options.length === 0) return null;

  const counts = new Map<string, number>();
  for (const item of items) {
    const value = item.values[statusColumn.id];
    if (typeof value === "string") counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  const segments = options.filter((option) => (counts.get(option.label) ?? 0) > 0);
  const doneCount = counts.get(DONE_LABEL) ?? 0;

  return (
    <div className="flex flex-1 items-center justify-end gap-2">
      <div className="flex h-1.5 w-32 overflow-hidden rounded-full bg-muted">
        {segments.map((option) => (
          <span
            key={option.label}
            style={{ backgroundColor: option.color, width: `${((counts.get(option.label) ?? 0) / items.length) * 100}%` }}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">
        {doneCount}/{items.length} concluídos
      </span>
    </div>
  );
}

export function GroupSection({
  boardId,
  workspaceSlug,
  group,
  columns,
  items,
  overdueItemIds,
  itemColumnWidth,
  canEdit = true,
  onGroupDeleted,
  onItemCreated,
  onItemDeleted,
}: {
  boardId: number;
  workspaceSlug: string;
  group: { id: number; name: string; color: string | null };
  columns: ColumnData[];
  items: ItemData[];
  overdueItemIds?: Set<number>;
  itemColumnWidth?: number | null;
  canEdit?: boolean;
  onGroupDeleted?: (groupId: number) => void;
  onItemCreated?: (item: { id: number; title: string; groupId: number }) => void;
  onItemDeleted?: (itemId: number) => void;
}) {
  const [, startTransition] = useTransition();
  const [collapsed, setCollapsed] = useState(false);
  const color = group.color ?? COLOR_PALETTE[0];
  const statusColumn = columns.find((column) => column.type === "status");
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `group-${group.id}`,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        borderLeft: `3px solid ${color}`,
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="flex flex-col gap-3 overflow-hidden rounded-xl border border-border bg-card pl-3 shadow-sm"
    >
      <div className={`flex items-center gap-2 pr-3 pt-3 ${collapsed ? "pb-3" : ""}`}>
        {canEdit && (
          <span
            {...attributes}
            {...listeners}
            className="cursor-grab select-none text-muted-foreground/40 hover:text-muted-foreground"
          >
            <GripVertical className="h-4 w-4" />
          </span>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="text-muted-foreground/60 hover:text-foreground"
          aria-label={collapsed ? "Expandir grupo" : "Minimizar grupo"}
        >
          <ChevronRight className={`h-4 w-4 transition-transform ${collapsed ? "" : "rotate-90"}`} />
        </button>
        {canEdit ? (
          <ColorSwatchPicker
            value={color}
            onChange={(next) => startTransition(() => setGroupColor(group.id, next))}
          />
        ) : (
          <span className="h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: color }} />
        )}
        {canEdit ? (
          <InlineEditableText
            value={group.name}
            onCommit={(next) => renameGroup(group.id, next)}
            className="text-sm font-semibold"
          />
        ) : (
          <span className="text-sm font-semibold">{group.name}</span>
        )}
        <Badge variant="secondary">{items.length}</Badge>
        {collapsed && <GroupFooterProgress items={items} statusColumn={statusColumn} />}
        {canEdit && (
          <DeleteGroupButton groupId={group.id} groupName={group.name} onDeleted={onGroupDeleted} />
        )}
      </div>

      {!collapsed && (
        <>
          <div className="min-w-0 pr-3">
            <BoardTable
              key={`${columns.map((c) => c.id).join(",")}|${items.map((i) => i.id).join(",")}`}
              boardId={boardId}
              workspaceSlug={workspaceSlug}
              columns={columns}
              items={items}
              overdueItemIds={overdueItemIds}
              itemColumnWidth={itemColumnWidth}
              canEdit={canEdit}
              onItemDeleted={onItemDeleted}
            />
          </div>

          <div className="flex items-center gap-2 pr-3 pb-3">
            {canEdit && (
              <CreateItemForm boardId={boardId} groupId={group.id} onCreated={onItemCreated} />
            )}
            <GroupFooterProgress items={items} statusColumn={statusColumn} />
          </div>
        </>
      )}
    </div>
  );
}
