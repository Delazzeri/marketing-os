"use client";

import { toISODate } from "@/lib/date-grid";
import type { WidgetProps } from "./types";

function startOfWeek(date: Date): Date {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  start.setHours(0, 0, 0, 0);
  return start;
}

const WEEKS_SHOWN = 8;

export function WeeksBarsWidget({ config, columns, items }: WidgetProps) {
  const dateColumn = columns.find((c) => c.id === config.columnId) ?? columns.find((c) => c.type === "date");

  if (!dateColumn) {
    return <p className="text-xs text-muted-foreground">Crie uma coluna de Data para usar este widget.</p>;
  }

  const today = startOfWeek(new Date());
  const weeks = Array.from({ length: WEEKS_SHOWN }, (_, i) => {
    const start = new Date(today);
    start.setDate(today.getDate() - (WEEKS_SHOWN - 1 - i) * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end, count: 0 };
  });

  for (const item of items) {
    const value = item.values[dateColumn.id];
    if (typeof value !== "string") continue;
    const itemDate = new Date(`${value}T00:00:00`);
    const week = weeks.find((w) => itemDate >= w.start && itemDate <= w.end);
    if (week) week.count += 1;
  }

  const max = Math.max(1, ...weeks.map((w) => w.count));
  const barHeight = 80;

  return (
    <svg viewBox={`0 0 ${weeks.length * 32} ${barHeight + 20}`} className="h-32 w-full" role="img">
      {weeks.map((week, index) => {
        const height = (week.count / max) * barHeight;
        const x = index * 32 + 4;
        return (
          <g key={toISODate(week.start)}>
            <rect x={x} y={barHeight - height} width={20} height={Math.max(height, week.count > 0 ? 2 : 0)} rx={3} fill="var(--color-primary)" />
            <text x={x + 10} y={barHeight + 14} textAnchor="middle" fontSize="8" fill="currentColor" opacity={0.6}>
              {week.start.getDate()}/{week.start.getMonth() + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
