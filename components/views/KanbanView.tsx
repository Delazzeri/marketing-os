"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { updateItemValue } from "@/lib/actions/columns";
import { Badge } from "@/components/ui/badge";
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

const NO_STATUS = "__no_status__";

function KanbanCard({ item, group }: { item: ItemData; group: GroupData | undefined }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `kanban-item-${item.id}`,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="flex cursor-grab flex-col gap-1.5 rounded-lg border border-border bg-card p-2.5 text-sm shadow-sm active:cursor-grabbing"
    >
      <span className="truncate">{item.title}</span>
      {group && (
        <Badge
          variant="secondary"
          className="w-fit text-[10px]"
          style={group.color ? { backgroundColor: `${group.color}20`, color: group.color } : undefined}
        >
          {group.name}
        </Badge>
      )}
    </div>
  );
}

function KanbanColumn({
  id,
  label,
  color,
  items,
  groups,
}: {
  id: string;
  label: string;
  color?: string;
  items: ItemData[];
  groups: GroupData[];
}) {
  const { setNodeRef } = useSortable({ id: `kanban-column-${id}`, data: { isColumn: true, statusValue: id } });

  return (
    <div className="flex w-64 shrink-0 flex-col gap-2 rounded-xl bg-muted/40 p-2.5">
      <div className="flex items-center gap-1.5 px-1">
        {color && <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />}
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Badge variant="secondary" className="ml-auto text-[10px]">
          {items.length}
        </Badge>
      </div>
      <div ref={setNodeRef} className="flex min-h-[40px] flex-col gap-2">
        <SortableContext items={items.map((item) => `kanban-item-${item.id}`)} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <KanbanCard key={item.id} item={item} group={groups.find((g) => g.id === item.groupId)} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export function KanbanView({
  groups,
  columns,
  items,
  canEdit = true,
}: {
  groups: GroupData[];
  columns: ColumnData[];
  items: ItemData[];
  canEdit?: boolean;
}) {
  const [, startTransition] = useTransition();
  const statusColumn = columns.find((column) => column.type === "status");
  const [orderedItems, setOrderedItems] = useState(items);
  const [prevItems, setPrevItems] = useState(items);
  if (items !== prevItems) {
    setPrevItems(items);
    setOrderedItems(items);
  }
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  if (!statusColumn) {
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Crie uma coluna de Status para usar o Kanban.
      </p>
    );
  }

  const resolvedStatusColumn = statusColumn;
  const options = (resolvedStatusColumn.config.options as { label: string; color: string }[] | undefined) ?? [];

  function itemsForStatus(statusValue: string | null) {
    return orderedItems.filter((item) => {
      const value = item.values[resolvedStatusColumn.id];
      return statusValue === NO_STATUS ? !value : value === statusValue;
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    if (!canEdit) return;
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    if (!activeId.startsWith("kanban-item-")) return;
    const itemId = Number(activeId.replace("kanban-item-", ""));

    const overId = String(over.id);
    let targetStatus: string | null = null;
    if (overId.startsWith("kanban-column-")) {
      targetStatus = overId.replace("kanban-column-", "");
    } else if (overId.startsWith("kanban-item-")) {
      const overItemId = Number(overId.replace("kanban-item-", ""));
      const overItem = orderedItems.find((item) => item.id === overItemId);
      targetStatus = overItem
        ? ((overItem.values[resolvedStatusColumn.id] as string | undefined) ?? NO_STATUS)
        : null;
    }
    if (targetStatus === null) return;

    const activeItem = orderedItems.find((item) => item.id === itemId);
    if (!activeItem) return;
    const currentStatus = (activeItem.values[resolvedStatusColumn.id] as string | undefined) ?? NO_STATUS;
    if (currentStatus === targetStatus) return;

    const resolvedValue = targetStatus === NO_STATUS ? null : targetStatus;
    setOrderedItems((current) =>
      current.map((item) =>
        item.id === itemId
          ? { ...item, values: { ...item.values, [resolvedStatusColumn.id]: resolvedValue } }
          : item,
      ),
    );
    startTransition(() => updateItemValue(itemId, resolvedStatusColumn.id, resolvedValue));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {options.map((option) => (
          <KanbanColumn
            key={option.label}
            id={option.label}
            label={option.label}
            color={option.color}
            items={itemsForStatus(option.label)}
            groups={groups}
          />
        ))}
        <KanbanColumn id={NO_STATUS} label="Sem status" items={itemsForStatus(NO_STATUS)} groups={groups} />
      </div>
    </DndContext>
  );
}
