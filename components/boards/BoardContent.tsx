"use client";

import { useMemo, useState } from "react";
import { GroupSection } from "@/components/boards/GroupSection";
import { BoardToolbar, type SortState } from "@/components/boards/BoardToolbar";
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

interface GroupData {
  id: number;
  name: string;
  color: string | null;
}

function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "pt-BR");
}

export function BoardContent({
  boardId,
  workspaceSlug,
  groups,
  columns,
  items,
  overdueItemIds,
}: {
  boardId: number;
  workspaceSlug: string;
  groups: GroupData[];
  columns: ColumnData[];
  items: ItemData[];
  overdueItemIds?: Set<number>;
}) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<number, Set<string>>>({});
  const [sort, setSort] = useState<SortState>({ columnId: null, direction: "asc" });

  const filterableColumns = useMemo(
    () =>
      columns
        .filter((column) => column.type === "status" || column.type === "format" || column.type === "select")
        .map((column) => ({
          column,
          options: (column.config.options as { label: string; color: string }[] | undefined) ?? [],
        }))
        .filter((entry) => entry.options.length > 0),
    [columns],
  );

  const sortableColumns = useMemo(
    () => columns.filter((column) => ["text", "number", "date", "status", "format", "select"].includes(column.type)),
    [columns],
  );

  function toggleFilter(columnId: number, label: string) {
    setFilters((prev) => {
      const next = { ...prev };
      const set = new Set(next[columnId] ?? []);
      if (set.has(label)) set.delete(label);
      else set.add(label);
      if (set.size === 0) delete next[columnId];
      else next[columnId] = set;
      return next;
    });
  }

  const filteredItems = useMemo(() => {
    let result = items;

    const trimmedSearch = search.trim().toLowerCase();
    if (trimmedSearch) {
      result = result.filter((item) => item.title.toLowerCase().includes(trimmedSearch));
    }

    const filterEntries = Object.entries(filters);
    if (filterEntries.length > 0) {
      result = result.filter((item) =>
        filterEntries.every(([columnId, labels]) => {
          const value = item.values[Number(columnId)];
          return typeof value === "string" && labels.has(value);
        }),
      );
    }

    if (sort.columnId) {
      const columnId = sort.columnId;
      result = [...result].sort((a, b) => {
        const cmp = compareValues(a.values[columnId], b.values[columnId]);
        return sort.direction === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [items, search, filters, sort]);

  return (
    <div className="flex flex-col gap-4">
      <BoardToolbar
        search={search}
        onSearchChange={setSearch}
        filterableColumns={filterableColumns}
        activeFilters={filters}
        onToggleFilter={toggleFilter}
        sortableColumns={sortableColumns}
        sort={sort}
        onSortChange={setSort}
      />

      <div className="flex flex-col gap-8">
        {groups.map((group) => {
          const groupItems = filteredItems.filter((item) => item.groupId === group.id);

          return (
            <GroupSection
              key={group.id}
              boardId={boardId}
              workspaceSlug={workspaceSlug}
              group={group}
              columns={columns}
              items={groupItems}
              overdueItemIds={overdueItemIds}
            />
          );
        })}
        {groups.length === 0 && <p className="text-sm text-muted-foreground">Nenhum grupo ainda.</p>}
      </div>
    </div>
  );
}
