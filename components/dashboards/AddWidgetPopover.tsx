"use client";

import { useTransition } from "react";
import { addWidget } from "@/lib/actions/dashboards";
import { dashboardWidgetRegistry } from "@/lib/dashboard-widgets/registry";
import type { DashboardWidgetType } from "@/lib/validation/dashboards";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function AddWidgetPopover({
  boardId,
  onAddStart,
  onAddSettled,
}: {
  boardId: number;
  onAddStart: (type: DashboardWidgetType, config: Record<string, unknown>) => number;
  onAddSettled: (tempId: number, realId: number | null) => void;
}) {
  const [, startTransition] = useTransition();

  function handleAdd(type: DashboardWidgetType) {
    const config = { title: dashboardWidgetRegistry[type].label };
    const tempId = onAddStart(type, config);
    startTransition(async () => {
      try {
        const created = await addWidget(boardId, type, config);
        onAddSettled(tempId, created.id);
      } catch {
        onAddSettled(tempId, null);
      }
    });
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button type="button" variant="outline" size="sm">
            <Plus />
            Widget
          </Button>
        }
      />
      <PopoverContent align="start" className="w-56 p-1">
        {(Object.entries(dashboardWidgetRegistry) as [DashboardWidgetType, (typeof dashboardWidgetRegistry)[DashboardWidgetType]][]).map(
          ([type, definition]) => (
            <button
              key={type}
              type="button"
              onClick={() => handleAdd(type)}
              className="block w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
            >
              {definition.label}
            </button>
          ),
        )}
      </PopoverContent>
    </Popover>
  );
}
