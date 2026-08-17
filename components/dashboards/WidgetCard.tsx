"use client";

import { useTransition } from "react";
import { deleteWidget } from "@/lib/actions/dashboards";
import { dashboardWidgetRegistry, type WidgetProps } from "@/lib/dashboard-widgets/registry";
import type { DashboardWidgetType } from "@/lib/validation/dashboards";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function WidgetCard({
  widgetId,
  type,
  title,
  props,
}: {
  widgetId: number;
  type: DashboardWidgetType;
  title: string;
  props: WidgetProps;
}) {
  const [, startTransition] = useTransition();
  const definition = dashboardWidgetRegistry[type];
  const Widget = definition.render;

  return (
    <div className="group/widget flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground">{title}</h3>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => startTransition(() => deleteWidget(widgetId))}
          className="text-muted-foreground/50 opacity-0 hover:text-destructive group-hover/widget:opacity-100"
          title="Remover widget"
        >
          <X />
        </Button>
      </div>
      <Widget {...props} />
    </div>
  );
}
