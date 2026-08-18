"use client";

import { useState, useTransition } from "react";
import { renameGroup, setGroupColor } from "@/lib/actions/items";
import { BoardTable } from "@/components/boards/BoardTable";
import { CreateItemForm } from "@/components/items/CreateItemForm";
import { DeleteGroupButton } from "@/components/boards/DeleteGroupButton";
import { InlineEditableText } from "@/components/layout/InlineEditableText";
import { ColorSwatchPicker } from "@/components/columns/ColorSwatchPicker";
import { COLOR_PALETTE } from "@/lib/column-types/color-palette";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
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
}: {
  boardId: number;
  workspaceSlug: string;
  group: { id: number; name: string; color: string | null };
  columns: ColumnData[];
  items: ItemData[];
  overdueItemIds?: Set<number>;
}) {
  const [, startTransition] = useTransition();
  const [collapsed, setCollapsed] = useState(false);
  const color = group.color ?? COLOR_PALETTE[0];
  const statusColumn = columns.find((column) => column.type === "status");

  return (
    <div
      className="flex flex-col gap-3 overflow-hidden rounded-xl border border-border bg-card pl-3 shadow-sm"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className={`flex items-center gap-2 pr-3 pt-3 ${collapsed ? "pb-3" : ""}`}>
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="text-muted-foreground/60 hover:text-foreground"
          aria-label={collapsed ? "Expandir grupo" : "Minimizar grupo"}
        >
          <ChevronRight className={`h-4 w-4 transition-transform ${collapsed ? "" : "rotate-90"}`} />
        </button>
        <ColorSwatchPicker
          value={color}
          onChange={(next) => startTransition(() => setGroupColor(group.id, next))}
        />
        <InlineEditableText
          value={group.name}
          onCommit={(next) => renameGroup(group.id, next)}
          className="text-sm font-semibold"
        />
        <Badge variant="secondary">{items.length}</Badge>
        {collapsed && <GroupFooterProgress items={items} statusColumn={statusColumn} />}
        <DeleteGroupButton groupId={group.id} groupName={group.name} />
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
            />
          </div>

          <div className="flex items-center gap-2 pr-3 pb-3">
            <CreateItemForm boardId={boardId} groupId={group.id} />
            <GroupFooterProgress items={items} statusColumn={statusColumn} />
          </div>
        </>
      )}
    </div>
  );
}
