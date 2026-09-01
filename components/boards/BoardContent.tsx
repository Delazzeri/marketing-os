"use client";

import { useId, useMemo, useState, useTransition } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { GroupSection } from "@/components/boards/GroupSection";
import { BoardToolbar, type SortState } from "@/components/boards/BoardToolbar";
import { reorderGroups, deleteGroup as deleteGroupAction, deleteItem as deleteItemAction } from "@/lib/actions/items";
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
  itemColumnWidth,
  canEdit = true,
}: {
  boardId: number;
  workspaceSlug: string;
  groups: GroupData[];
  columns: ColumnData[];
  items: ItemData[];
  overdueItemIds?: Set<number>;
  itemColumnWidth?: number | null;
  canEdit?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<number, Set<string>>>({});
  const [sort, setSort] = useState<SortState>({ columnId: null, direction: "asc" });
  const [orderedGroups, setOrderedGroups] = useState(groups);
  const [localItems, setLocalItems] = useState(items);
  const [, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const dndId = useId();

  // Server Component parent only re-renders after a mutation triggers
  // revalidatePath — local state exists so create/delete of groups and items
  // (below) can reflect immediately instead of waiting for that round-trip;
  // this re-sync picks up the revalidated data once it does land, same
  // pattern AppSidebar.tsx uses for boards/folders.
  const [prevGroups, setPrevGroups] = useState(groups);
  if (groups !== prevGroups) {
    setPrevGroups(groups);
    setOrderedGroups(groups);
  }
  const [prevItems, setPrevItems] = useState(items);
  if (items !== prevItems) {
    setPrevItems(items);
    setLocalItems(items);
  }

  function handleGroupDeleted(groupId: number) {
    const prev = orderedGroups;
    setOrderedGroups((current) => current.filter((g) => g.id !== groupId));
    startTransition(async () => {
      try {
        await deleteGroupAction(groupId);
      } catch {
        setOrderedGroups(prev);
      }
    });
  }

  function handleItemCreated(item: { id: number; title: string; groupId: number }) {
    setLocalItems((current) =>
      current.some((i) => i.id === item.id) ? current : [...current, { ...item, values: {} }],
    );
  }

  function handleItemDeleted(itemId: number) {
    const prev = localItems;
    setLocalItems((current) => current.filter((i) => i.id !== itemId));
    startTransition(async () => {
      try {
        await deleteItemAction(itemId);
      } catch {
        setLocalItems(prev);
      }
    });
  }

  function handleGroupDragEnd(event: DragEndEvent) {
    if (!canEdit) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedGroups.findIndex((g) => `group-${g.id}` === active.id);
    const newIndex = orderedGroups.findIndex((g) => `group-${g.id}` === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(orderedGroups, oldIndex, newIndex);
    setOrderedGroups(next);
    startTransition(() => reorderGroups(next.map((g) => g.id)));
  }

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
    let result = localItems;

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
  }, [localItems, search, filters, sort]);

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

      <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleGroupDragEnd}>
        <SortableContext items={orderedGroups.map((g) => `group-${g.id}`)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-8">
            {orderedGroups.map((group) => {
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
                  itemColumnWidth={itemColumnWidth}
                  canEdit={canEdit}
                  onGroupDeleted={handleGroupDeleted}
                  onItemCreated={handleItemCreated}
                  onItemDeleted={handleItemDeleted}
                />
              );
            })}
            {orderedGroups.length === 0 && <p className="text-sm text-muted-foreground">Nenhum grupo ainda.</p>}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
