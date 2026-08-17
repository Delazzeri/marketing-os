"use client";

import { useState } from "react";
import { DashboardTabs } from "@/components/dashboards/DashboardTabs";
import { AddWidgetPopover } from "@/components/dashboards/AddWidgetPopover";
import { WidgetCard } from "@/components/dashboards/WidgetCard";
import type { WidgetColumnData, WidgetItemData } from "@/lib/dashboard-widgets/registry";
import type { DashboardWidgetType } from "@/lib/validation/dashboards";

interface DashboardData {
  id: number;
  name: string;
}

interface WidgetData {
  id: number;
  dashboardId: number;
  type: DashboardWidgetType;
  config: { title?: string; columnId?: number; [key: string]: unknown };
}

export function DashboardView({
  boardId,
  dashboards,
  widgets,
  columns,
  items,
}: {
  boardId: number;
  dashboards: DashboardData[];
  widgets: WidgetData[];
  columns: WidgetColumnData[];
  items: WidgetItemData[];
}) {
  const [activeDashboardId, setActiveDashboardId] = useState<number | null>(dashboards[0]?.id ?? null);

  if (dashboards.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-12 text-center">
        <p className="text-sm text-muted-foreground">Nenhum dashboard ainda.</p>
        <DashboardTabs
          boardId={boardId}
          dashboards={dashboards}
          activeDashboardId={activeDashboardId}
          onSelect={setActiveDashboardId}
        />
      </div>
    );
  }

  const activeId = activeDashboardId && dashboards.some((d) => d.id === activeDashboardId)
    ? activeDashboardId
    : dashboards[0].id;
  const activeWidgets = widgets.filter((widget) => widget.dashboardId === activeId);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <DashboardTabs
          boardId={boardId}
          dashboards={dashboards}
          activeDashboardId={activeId}
          onSelect={setActiveDashboardId}
        />
        <AddWidgetPopover dashboardId={activeId} />
      </div>

      {activeWidgets.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum widget ainda. Use &ldquo;+ Widget&rdquo; para adicionar.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeWidgets.map((widget) => (
            <WidgetCard
              key={widget.id}
              widgetId={widget.id}
              type={widget.type}
              title={widget.config.title ?? ""}
              props={{ config: widget.config, columns, items }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
