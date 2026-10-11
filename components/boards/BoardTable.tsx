"use client";

import { useId, useState, useTransition, type PointerEvent as ReactPointerEvent } from "react";
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
import { ColumnHeaderMenu } from "@/components/columns/ColumnHeaderMenu";
import { CreateColumnForm } from "@/components/columns/CreateColumnForm";
import { deleteItem, deleteItems, reorderItems } from "@/lib/actions/items";
import { reorderColumns, setColumnWidth } from "@/lib/actions/columns";
import { setItemColumnWidth } from "@/lib/actions/boards";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { GripVertical, Trash2 } from "lucide-react";
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

const MIN_COLUMN_WIDTH = 120;
const DEFAULT_COLUMN_WIDTH = 160;
const MIN_ITEM_COLUMN_WIDTH = 160;
const DEFAULT_ITEM_COLUMN_WIDTH = 200;

// Shared drag-to-resize logic for both the "Item" header and regular column
// headers — only the min width, saved value, and persist callback differ.
function useResizableWidth(savedWidth: number, minWidth: number, onResize: (width: number) => void) {
  const [width, setWidth] = useState(savedWidth);
  const [resizing, setResizing] = useState(false);

  // Re-sync when the saved value changes elsewhere (e.g. another tab
  // resized it) — same pattern as AppSidebar.tsx's board/folder prop sync.
  const [prevSavedWidth, setPrevSavedWidth] = useState(savedWidth);
  if (savedWidth !== prevSavedWidth) {
    setPrevSavedWidth(savedWidth);
    setWidth(savedWidth);
  }

  function startResize(event: ReactPointerEvent) {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startWidth = width;
    setResizing(true);

    function onMove(moveEvent: PointerEvent) {
      setWidth(Math.round(Math.max(minWidth, startWidth + (moveEvent.clientX - startX))));
    }
    function onUp(upEvent: PointerEvent) {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      setResizing(false);
      const finalWidth = Math.round(Math.max(minWidth, startWidth + (upEvent.clientX - startX)));
      setWidth(finalWidth);
      onResize(finalWidth);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  return { width, resizing, startResize };
}

function ResizeHandle({ resizing, onPointerDown }: { resizing: boolean; onPointerDown: (event: ReactPointerEvent) => void }) {
  return (
    <span
      onPointerDown={onPointerDown}
      className={`absolute top-0 right-0 h-full w-1.5 cursor-col-resize select-none ${
        resizing ? "bg-primary" : "hover:bg-primary/40"
      }`}
    />
  );
}

function ItemColumnHeader({
  boardId,
  savedWidth,
  canEdit,
}: {
  boardId: number;
  savedWidth: number;
  canEdit: boolean;
}) {
  const [, startTransition] = useTransition();
  const { width, resizing, startResize } = useResizableWidth(savedWidth, MIN_ITEM_COLUMN_WIDTH, (finalWidth) =>
    startTransition(() => setItemColumnWidth(boardId, finalWidth)),
  );

  return (
    <th
      style={{ width, minWidth: width, maxWidth: width }}
      className="relative px-3 py-2 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase"
    >
      Item
      {canEdit && <ResizeHandle resizing={resizing} onPointerDown={startResize} />}
    </th>
  );
}

function SortableColumnHeader({
  boardId,
  column,
  canEdit,
}: {
  boardId: number;
  column: ColumnData;
  canEdit: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `column-${column.id}`,
    disabled: !canEdit,
  });
  const [, startTransition] = useTransition();
  const savedWidth = (column.config.width as number | undefined) ?? DEFAULT_COLUMN_WIDTH;
  const { width, resizing, startResize } = useResizableWidth(savedWidth, MIN_COLUMN_WIDTH, (finalWidth) =>
    startTransition(() => setColumnWidth(column.id, finalWidth)),
  );

  return (
    <th
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        width,
        minWidth: width,
        maxWidth: width,
      }}
      className="group relative border-l border-border/60 px-3 py-2 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase"
    >
      <div className="flex items-center gap-1.5 overflow-hidden">
        {canEdit && (
          <span
            {...attributes}
            {...listeners}
            className="shrink-0 cursor-grab select-none text-muted-foreground/50 opacity-0 group-hover:opacity-100"
          >
            <GripVertical className="h-4 w-4" />
          </span>
        )}
        <span className="truncate">{column.name}</span>
        {canEdit && <ColumnHeaderMenu boardId={boardId} column={column} />}
      </div>
      {canEdit && <ResizeHandle resizing={resizing} onPointerDown={startResize} />}
    </th>
  );
}

function SortableItemRow({
  item,
  columns,
  workspaceSlug,
  boardId,
  overdue,
  selected,
  onSelectChange,
  itemColumnWidth,
  canEdit,
  onDelete,
}: {
  item: ItemData;
  columns: ColumnData[];
  workspaceSlug: string;
  boardId: number;
  overdue?: boolean;
  selected: boolean;
  onSelectChange: (checked: boolean) => void;
  itemColumnWidth: number;
  canEdit: boolean;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `item-${item.id}`,
    disabled: !canEdit,
  });

  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="group border-b border-border/40 last:border-0 hover:bg-muted/30"
    >
      {canEdit && (
        <td className="w-8 px-2 py-1.5">
          <Checkbox
            checked={selected}
            onCheckedChange={(checked) => onSelectChange(checked === true)}
            aria-label={`Selecionar ${item.title}`}
          />
        </td>
      )}
      <td
        className="overflow-hidden px-3 py-1.5"
        style={{ width: itemColumnWidth, minWidth: itemColumnWidth, maxWidth: itemColumnWidth }}
      >
        <div className="flex items-center gap-1.5">
          {canEdit && (
            <span {...attributes} {...listeners} className="cursor-grab select-none text-muted-foreground/50">
              <GripVertical className="h-4 w-4" />
            </span>
          )}
          <Link
            data-tour="item-title"
            href={`/${workspaceSlug}/boards/${boardId}/items/${item.id}`}
            className={`truncate hover:underline ${overdue ? "text-destructive" : ""}`}
          >
            {item.title}
          </Link>
          {overdue && (
            <Badge variant="destructive" className="shrink-0 rounded-full text-[10px]">
              atrasado
            </Badge>
          )}
          {canEdit && (
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="ml-auto shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground hover:text-destructive"
                    title="Excluir item"
                    aria-label={`Excluir ${item.title}`}
                  >
                    <Trash2 />
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir &ldquo;{item.title}&rdquo;?</AlertDialogTitle>
                  <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={onDelete}
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </td>
      {columns.map((column) => (
        <td
          key={column.id}
          data-tour={column.type === "status" ? "status-cell" : undefined}
          className="overflow-hidden px-1 py-1"
          style={{
            width: (column.config.width as number | undefined) ?? DEFAULT_COLUMN_WIDTH,
            maxWidth: (column.config.width as number | undefined) ?? DEFAULT_COLUMN_WIDTH,
          }}
        >
          <EditableCell
            itemId={item.id}
            columnId={column.id}
            columnType={column.type}
            config={column.config}
            value={item.values[column.id]}
            canEdit={canEdit}
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
  itemColumnWidth,
  canEdit = true,
  onItemDeleted,
}: {
  boardId: number;
  workspaceSlug: string;
  columns: ColumnData[];
  items: ItemData[];
  overdueItemIds?: Set<number>;
  itemColumnWidth?: number | null;
  canEdit?: boolean;
  onItemDeleted?: (itemId: number) => void;
}) {
  const resolvedItemColumnWidth = itemColumnWidth ?? DEFAULT_ITEM_COLUMN_WIDTH;
  const [orderedColumns, setOrderedColumns] = useState(columns);
  const [orderedItems, setOrderedItems] = useState(items);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const dndId = useId();

  const allSelected = orderedItems.length > 0 && orderedItems.every((item) => selectedIds.has(item.id));
  const someSelected = selectedIds.size > 0;

  function toggleSelectAll(checked: boolean) {
    setSelectedIds(checked ? new Set(orderedItems.map((item) => item.id)) : new Set());
  }

  function toggleSelect(itemId: number, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(itemId);
      else next.delete(itemId);
      return next;
    });
  }

  function handleDeleteSelected() {
    const ids = Array.from(selectedIds);
    setSelectedIds(new Set());
    setOrderedItems((current) => current.filter((item) => !ids.includes(item.id)));
    if (onItemDeleted) {
      for (const id of ids) onItemDeleted(id);
    } else {
      startTransition(() => deleteItems(ids));
    }
  }

  function handleDeleteItem(itemId: number) {
    setOrderedItems((current) => current.filter((item) => item.id !== itemId));
    if (onItemDeleted) {
      onItemDeleted(itemId);
    } else {
      startTransition(() => deleteItem(itemId));
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    if (!canEdit) return;
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
    <div className="flex flex-col gap-2">
      {someSelected && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-3 py-1.5">
          <span className="text-xs text-muted-foreground">{selectedIds.size} selecionado(s)</span>
          <Button type="button" variant="destructive" size="sm" onClick={handleDeleteSelected}>
            <Trash2 />
            Apagar selecionados
          </Button>
        </div>
      )}
      <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                {canEdit && (
                  <th className="w-8 px-2 py-2">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(checked) => toggleSelectAll(checked === true)}
                      aria-label="Selecionar todos"
                    />
                  </th>
                )}
                <ItemColumnHeader boardId={boardId} savedWidth={resolvedItemColumnWidth} canEdit={canEdit} />
                <SortableContext
                  items={orderedColumns.map((c) => `column-${c.id}`)}
                  strategy={horizontalListSortingStrategy}
                >
                  {orderedColumns.map((column) => (
                    <SortableColumnHeader key={column.id} boardId={boardId} column={column} canEdit={canEdit} />
                  ))}
                </SortableContext>
                {canEdit && (
                  <th className="px-2 py-2">
                    <CreateColumnForm boardId={boardId} />
                  </th>
                )}
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
                    selected={selectedIds.has(item.id)}
                    onSelectChange={(checked) => toggleSelect(item.id, checked)}
                    itemColumnWidth={resolvedItemColumnWidth}
                    canEdit={canEdit}
                    onDelete={() => handleDeleteItem(item.id)}
                  />
                ))}
              </SortableContext>
            </tbody>
          </table>
        </div>
      </DndContext>
    </div>
  );
}
