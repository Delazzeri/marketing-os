"use client";

import { columnTypeRegistry } from "@/lib/column-types/registry";
import type { ColumnType } from "@/lib/column-types/schemas";
import { monthGridDays, toISODate, WEEKDAY_LABELS } from "@/lib/date-grid";

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

export function PortalCalendar({
  dateColumn,
  items,
  reference = new Date(),
}: {
  dateColumn: ColumnData;
  items: ItemData[];
  reference?: Date;
}) {
  const itemsByDate = new Map<string, ItemData[]>();
  for (const item of items) {
    const value = item.values[dateColumn.id];
    if (typeof value !== "string") continue;
    const list = itemsByDate.get(value) ?? [];
    list.push(item);
    itemsByDate.set(value, list);
  }

  const days = monthGridDays(reference);
  const currentMonth = reference.getMonth();
  const Badge = columnTypeRegistry[dateColumn.type].renderCalendarBadge;

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="grid grid-cols-7 border-b border-border bg-muted/50 text-xs font-medium text-muted-foreground">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="px-2 py-1.5">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const iso = toISODate(day);
          const dayItems = itemsByDate.get(iso) ?? [];
          const inCurrentMonth = day.getMonth() === currentMonth;

          return (
            <div
              key={iso}
              className={`min-h-[90px] border-b border-r border-border/60 p-1.5 ${
                inCurrentMonth ? "" : "bg-muted/30"
              }`}
            >
              <span className={`text-xs ${inCurrentMonth ? "text-foreground" : "text-muted-foreground"}`}>
                {day.getDate()}
              </span>
              <div className="mt-1 flex flex-col gap-0.5">
                {dayItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-1 truncate rounded px-1 py-0.5 text-xs">
                    {Badge && <Badge value={item.values[dateColumn.id] as never} config={dateColumn.config} />}
                    <span className="truncate">{item.title}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
