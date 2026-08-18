"use client";

import { useState } from "react";
import { PortalTable } from "@/components/portal/PortalTable";
import { PortalCalendar } from "@/components/portal/PortalCalendar";
import { ViewToggle } from "@/components/views/ViewToggle";
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

export function PortalViewSwitcher({
  groups,
  columns,
  items,
  dateColumn,
}: {
  groups: GroupData[];
  columns: ColumnData[];
  items: ItemData[];
  dateColumn: ColumnData | undefined;
}) {
  const [view, setView] = useState<"table" | "calendar" | "dashboard" | "whiteboard">("table");

  return (
    <>
      <ViewToggle
        hasDateColumn={Boolean(dateColumn)}
        showDashboardTab={false}
        showWhiteboardTab={false}
        view={view}
        onViewChange={setView}
      />

      {view === "calendar" && dateColumn ? (
        <PortalCalendar dateColumn={dateColumn} items={items} />
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map((group) => {
            const groupItems = items.filter((item) => item.groupId === group.id);
            return (
              <div key={group.id} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="h-4 w-1 shrink-0 rounded-full"
                    style={{ backgroundColor: group.color ?? "var(--color-muted-foreground)" }}
                  />
                  <h2 className="text-sm font-semibold">{group.name}</h2>
                </div>
                <PortalTable columns={columns} items={groupItems} />
              </div>
            );
          })}
          {groups.length === 0 && <p className="text-sm text-muted-foreground">Nenhum item ainda.</p>}
        </div>
      )}
    </>
  );
}
