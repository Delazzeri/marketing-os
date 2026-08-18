"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, horizontalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VIEW_KINDS, type ViewKind } from "@/lib/validation/boards";

const VIEW_LABELS: Record<ViewKind, string> = {
  table: "Tabela",
  calendar: "Calendário",
  kanban: "Kanban",
  dashboard: "Dashboards",
};

function SortableTabTrigger({
  view,
  disabled,
  title,
  canReorder,
}: {
  view: ViewKind;
  disabled?: boolean;
  title?: string;
  canReorder: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: view,
    disabled: !canReorder,
  });

  return (
    <TabsTrigger
      ref={setNodeRef}
      value={view}
      disabled={disabled}
      title={title}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 }}
      {...(canReorder ? { ...attributes, ...listeners } : {})}
    >
      {VIEW_LABELS[view]}
    </TabsTrigger>
  );
}

export function ViewToggle({
  hasDateColumn,
  showDashboardTab = true,
  order = VIEW_KINDS as unknown as ViewKind[],
  onOrderChange,
  view,
  onViewChange,
}: {
  hasDateColumn: boolean;
  showDashboardTab?: boolean;
  order?: ViewKind[];
  onOrderChange?: (order: ViewKind[]) => void;
  view: string;
  onViewChange: (view: ViewKind) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const canReorder = Boolean(onOrderChange);
  const visibleOrder = order.filter((kind) => kind !== "dashboard" || showDashboardTab);

  function handleDragEnd(event: DragEndEvent) {
    if (!onOrderChange) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = order.indexOf(active.id as ViewKind);
    const newIndex = order.indexOf(over.id as ViewKind);
    if (oldIndex === -1 || newIndex === -1) return;
    onOrderChange(arrayMove(order, oldIndex, newIndex));
  }

  return (
    <Tabs value={view} onValueChange={(value) => onViewChange(value as ViewKind)}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={visibleOrder} strategy={horizontalListSortingStrategy}>
          <TabsList>
            {visibleOrder.map((kind) => (
              <SortableTabTrigger
                key={kind}
                view={kind}
                canReorder={canReorder}
                disabled={kind === "calendar" && !hasDateColumn}
                title={kind === "calendar" && !hasDateColumn ? "Crie uma coluna de Data para usar o Calendário" : undefined}
              />
            ))}
          </TabsList>
        </SortableContext>
      </DndContext>
    </Tabs>
  );
}
