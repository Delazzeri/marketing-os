"use client";

import { useId, useState, useTransition } from "react";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EditableCell } from "@/components/columns/EditableCell";
import { deleteItem, reorderItems } from "@/lib/actions/items";
import { deleteColumn, reorderColumns } from "@/lib/actions/columns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GripVertical, X } from "lucide-react";
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
  values: Record<string, unknown>;
}

function SortableColumnHeader({ column }: { column: ColumnData }) {
  const [, startTransition] = useTransition();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `column-${column.id}`,
  });

  return (
    <th
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="min-w-[160px] px-3 py-2 text-left font-medium text-muted-foreground"
    >
      <div className="flex items-center gap-1.5">
        <span {...attributes} {...listeners} className="cursor-grab select-none text-muted-foreground/50">
          <GripVertical className="h-4 w-4" />
        </span>
        {column.name}
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => startTransition(() => deleteColumn(column.id))}
          className="ml-auto text-muted-foreground/50 hover:text-destructive"
          title="Excluir coluna"
        >
          <X />
        </Button>
      </div>
    </th>
  );
}

function SortableItemRow({
  item,
  columns,
  workspaceSlug,
  boardId,
  overdue,
}: {
  item: ItemData;
  columns: ColumnData[];
  workspaceSlug: string;
  boardId: number;
  overdue?: boolean;
}) {
  const [, startTransition] = useTransition();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `item-${item.id}`,
  });

  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="group border-b border-border/60 last:border-0 hover:bg-muted/40"
    >
      <td className="px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          <span {...attributes} {...listeners} className="cursor-grab select-none text-muted-foreground/50">
            <GripVertical className="h-4 w-4" />
          </span>
          <Link
            href={`/${workspaceSlug}/boards/${boardId}/items/${item.id}`}
            className={`hover:underline ${overdue ? "text-destructive" : ""}`}
          >
            {item.title}
          </Link>
          {overdue && (
            <Badge variant="destructive" className="rounded-full text-[10px]">
              atrasado
            </Badge>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => startTransition(() => deleteItem(item.id))}
            className="ml-auto text-muted-foreground/50 opacity-0 group-hover:opacity-100 hover:text-destructive"
            title="Excluir item"
          >
            <X />
          </Button>
        </div>
      </td>
      {columns.map((column) => (
        <td key={column.id} className="px-1 py-1">
          <EditableCell
            itemId={item.id}
            columnId={column.id}
            columnType={column.type}
            config={column.config}
            value={item.values[column.id]}
          />
        </td>
      ))}
    </tr>
  );
}

export function BoardTable({
  boardId,
  workspaceSlug,
  columns,
  items,
  overdueItemIds,
}: {
  boardId: number;
  workspaceSlug: string;
  columns: ColumnData[];
  items: ItemData[];
  overdueItemIds?: Set<number>;
}) {
  const [orderedColumns, setOrderedColumns] = useState(columns);
  const [orderedItems, setOrderedItems] = useState(items);
  const [, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const dndId = useId();

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId.startsWith("column-") && overId.startsWith("column-")) {
      const oldIndex = orderedColumns.findIndex((c) => `column-${c.id}` === activeId);
      const newIndex = orderedColumns.findIndex((c) => `column-${c.id}` === overId);
      const next = arrayMove(orderedColumns, oldIndex, newIndex);
      setOrderedColumns(next);
      startTransition(() => reorderColumns(next.map((c) => c.id)));
      return;
    }

    if (activeId.startsWith("item-") && overId.startsWith("item-")) {
      const oldIndex = orderedItems.findIndex((i) => `item-${i.id}` === activeId);
      const newIndex = orderedItems.findIndex((i) => `item-${i.id}` === overId);
      const next = arrayMove(orderedItems, oldIndex, newIndex);
      setOrderedItems(next);
      startTransition(() => reorderItems(next.map((i) => i.id)));
    }
  }

  return (
    <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="min-w-[200px] px-3 py-2 text-left font-medium text-muted-foreground">Item</th>
              <SortableContext
                items={orderedColumns.map((c) => `column-${c.id}`)}
                strategy={horizontalListSortingStrategy}
              >
                {orderedColumns.map((column) => (
                  <SortableColumnHeader key={column.id} column={column} />
                ))}
              </SortableContext>
            </tr>
          </thead>
          <tbody>
            <SortableContext
              items={orderedItems.map((i) => `item-${i.id}`)}
              strategy={verticalListSortingStrategy}
            >
              {orderedItems.map((item) => (
                <SortableItemRow
                  key={item.id}
                  item={item}
                  columns={orderedColumns}
                  workspaceSlug={workspaceSlug}
                  boardId={boardId}
                  overdue={overdueItemIds?.has(item.id)}
                />
              ))}
            </SortableContext>
          </tbody>
        </table>
      </div>
    </DndContext>
  );
}
