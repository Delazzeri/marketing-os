"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { updateItemValue, reorderStatusOptions } from "@/lib/actions/columns";
import { Badge } from "@/components/ui/badge";
import { GripVertical } from "lucide-react";
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

interface StatusOption {
  label: string;
  color: string;
}

const NO_STATUS = "__no_status__";

function KanbanCard({
  item,
  group,
  workspaceSlug,
  boardId,
  canEdit,
}: {
  item: ItemData;
  group: GroupData | undefined;
  workspaceSlug?: string;
  boardId?: number;
  canEdit: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `kanban-item-${item.id}`,
    disabled: !canEdit,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="group flex flex-col gap-1.5 rounded-lg border border-border bg-card p-2.5 text-sm shadow-sm"
    >
      <div className="flex items-start gap-1.5">
        {canEdit && (
          <span
            {...attributes}
            {...listeners}
            className="mt-0.5 shrink-0 cursor-grab select-none text-muted-foreground/40 opacity-0 group-hover:opacity-100 active:cursor-grabbing"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </span>
        )}
        {workspaceSlug && boardId ? (
          <Link
            href={`/${workspaceSlug}/boards/${boardId}/items/${item.id}`}
            className="flex-1 truncate hover:underline"
          >
            {item.title}
          </Link>
        ) : (
          <span className="flex-1 truncate">{item.title}</span>
        )}
      </div>
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
  workspaceSlug,
  boardId,
  canEdit,
  canReorderColumn,
}: {
  id: string;
  label: string;
  color?: string;
  items: ItemData[];
  groups: GroupData[];
  workspaceSlug?: string;
  boardId?: number;
  canEdit: boolean;
  canReorderColumn: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `kanban-column-${id}`, disabled: !canReorderColumn });
  const { setNodeRef: setDroppableRef } = useDroppable({ id: `kanban-drop-${id}` });

  return (
    <div
      ref={setSortableRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="flex w-64 shrink-0 flex-col gap-2 rounded-xl bg-muted/40 p-2.5"
    >
      <div className="flex items-center gap-1.5 px-1">
        {canReorderColumn && (
          <span {...attributes} {...listeners} className="cursor-grab select-none text-muted-foreground/40 active:cursor-grabbing">
            <GripVertical className="h-3.5 w-3.5" />
          </span>
        )}
        {color && <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />}
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Badge variant="secondary" className="ml-auto text-[10px]">
          {items.length}
        </Badge>
      </div>
      <div ref={setDroppableRef} className="flex min-h-[70vh] flex-col gap-2">
        <SortableContext items={items.map((item) => `kanban-item-${item.id}`)} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <KanbanCard
              key={item.id}
              item={item}
              group={groups.find((g) => g.id === item.groupId)}
              workspaceSlug={workspaceSlug}
              boardId={boardId}
              canEdit={canEdit}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export function KanbanView({
  workspaceSlug,
  boardId,
  groups,
  columns,
  items,
  canEdit = true,
}: {
  workspaceSlug?: string;
  boardId?: number;
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
  const initialOptions = ((statusColumn?.config.options as StatusOption[] | undefined) ?? []);
  const [orderedOptions, setOrderedOptions] = useState(initialOptions);
  const [prevOptionsKey, setPrevOptionsKey] = useState(initialOptions.map((o) => o.label).join("|"));
  const optionsKey = initialOptions.map((o) => o.label).join("|");
  if (optionsKey !== prevOptionsKey) {
    setPrevOptionsKey(optionsKey);
    setOrderedOptions(initialOptions);
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
    const overId = String(over.id);

    if (activeId.startsWith("kanban-column-") && overId.startsWith("kanban-column-")) {
      const activeLabel = activeId.replace("kanban-column-", "");
      const overLabel = overId.replace("kanban-column-", "");
      if (activeLabel === overLabel) return;
      const oldIndex = orderedOptions.findIndex((option) => option.label === activeLabel);
      const newIndex = orderedOptions.findIndex((option) => option.label === overLabel);
      if (oldIndex === -1 || newIndex === -1) return;
      const next = arrayMove(orderedOptions, oldIndex, newIndex);
      setOrderedOptions(next);
      startTransition(() => reorderStatusOptions(resolvedStatusColumn.id, next.map((option) => option.label)));
      return;
    }

    if (!activeId.startsWith("kanban-item-")) return;
    const itemId = Number(activeId.replace("kanban-item-", ""));

    let targetStatus: string | null = null;
    if (overId.startsWith("kanban-drop-")) {
      targetStatus = overId.replace("kanban-drop-", "");
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
      <SortableContext
        items={orderedOptions.map((option) => `kanban-column-${option.label}`)}
        strategy={horizontalListSortingStrategy}
      >
        <div className="flex min-w-0 gap-3 overflow-x-auto pb-2">
          {orderedOptions.map((option) => (
            <KanbanColumn
              key={option.label}
              id={option.label}
              label={option.label}
              color={option.color}
              items={itemsForStatus(option.label)}
              groups={groups}
              workspaceSlug={workspaceSlug}
              boardId={boardId}
              canEdit={canEdit}
              canReorderColumn={canEdit}
            />
          ))}
          <KanbanColumn
            id={NO_STATUS}
            label="Sem status"
            items={itemsForStatus(NO_STATUS)}
            groups={groups}
            workspaceSlug={workspaceSlug}
            boardId={boardId}
            canEdit={canEdit}
            canReorderColumn={false}
          />
        </div>
      </SortableContext>
    </DndContext>
  );
}
