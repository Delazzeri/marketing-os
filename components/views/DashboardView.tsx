"use client";

import { useRef, useState, useTransition } from "react";
import { AddWidgetPopover } from "@/components/dashboards/AddWidgetPopover";
import { WidgetCard } from "@/components/dashboards/WidgetCard";
import { deleteWidget } from "@/lib/actions/dashboards";
import type { WidgetColumnData, WidgetItemData } from "@/lib/dashboard-widgets/registry";
import type { DashboardWidgetType } from "@/lib/validation/dashboards";

interface WidgetData {
  id: number;
  type: DashboardWidgetType;
  config: { title?: string; columnId?: number; [key: string]: unknown };
}

export function DashboardView({
  boardId,
  widgets,
  columns,
  items,
}: {
  boardId: number;
  widgets: WidgetData[];
  columns: WidgetColumnData[];
  items: WidgetItemData[];
}) {
  const [localWidgets, setLocalWidgets] = useState(widgets);
  const [prevWidgets, setPrevWidgets] = useState(widgets);
  if (widgets !== prevWidgets) {
    setPrevWidgets(widgets);
    setLocalWidgets(widgets);
  }
  const nextTempId = useRef(-1);
  const [, startTransition] = useTransition();

  function handleAddStart(type: DashboardWidgetType, config: Record<string, unknown>) {
    const tempId = nextTempId.current--;
    setLocalWidgets((current) => [...current, { id: tempId, type, config }]);
    return tempId;
  }

  function handleAddSettled(tempId: number, realId: number | null) {
    setLocalWidgets((current) =>
      realId === null
        ? current.filter((widget) => widget.id !== tempId)
        : current.map((widget) => (widget.id === tempId ? { ...widget, id: realId } : widget)),
    );
  }

  function handleDelete(widgetId: number) {
    setLocalWidgets((current) => current.filter((widget) => widget.id !== widgetId));
    if (widgetId > 0) startTransition(() => deleteWidget(widgetId));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <AddWidgetPopover boardId={boardId} onAddStart={handleAddStart} onAddSettled={handleAddSettled} />
      </div>

      {localWidgets.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum widget ainda. Use &ldquo;+ Widget&rdquo; para adicionar.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {localWidgets.map((widget) => (
            <WidgetCard
              key={widget.id}
              widgetId={widget.id}
              type={widget.type}
              title={widget.config.title ?? ""}
              props={{ config: widget.config, columns, items }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
