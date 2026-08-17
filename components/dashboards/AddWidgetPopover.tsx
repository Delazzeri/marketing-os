"use client";

import { useTransition } from "react";
import { addWidget } from "@/lib/actions/dashboards";
import { dashboardWidgetRegistry } from "@/lib/dashboard-widgets/registry";
import type { DashboardWidgetType } from "@/lib/validation/dashboards";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function AddWidgetPopover({ dashboardId }: { dashboardId: number }) {
  const [, startTransition] = useTransition();

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
              onClick={() => startTransition(() => addWidget(dashboardId, type, { title: definition.label }))}
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
