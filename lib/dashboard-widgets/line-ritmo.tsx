"use client";

import type { WidgetProps } from "./types";

const WEEKS_SHOWN = 8;

function startOfWeek(date: Date): Date {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  start.setHours(0, 0, 0, 0);
  return start;
}

// Cumulative pace: how many items had their date-column value fall on/before
// each week's end, read as "work logged by this point." Not a burndown
// against a target — there's no target/estimate concept in the schema yet.
export function LineRitmoWidget({ config, columns, items }: WidgetProps) {
  const dateColumn = columns.find((c) => c.id === config.columnId) ?? columns.find((c) => c.type === "date");

  if (!dateColumn) {
    return <p className="text-xs text-muted-foreground">Crie uma coluna de Data para usar este widget.</p>;
  }

  const today = startOfWeek(new Date());
  const weeks = Array.from({ length: WEEKS_SHOWN }, (_, i) => {
    const end = new Date(today);
    end.setDate(today.getDate() - (WEEKS_SHOWN - 1 - i) * 7 + 6);
    return { end, cumulative: 0 };
  });

  const dates = items
    .map((item) => item.values[dateColumn.id])
    .filter((value): value is string => typeof value === "string")
    .map((value) => new Date(`${value}T00:00:00`));

  for (const week of weeks) {
    week.cumulative = dates.filter((date) => date <= week.end).length;
  }

  const max = Math.max(1, ...weeks.map((w) => w.cumulative));
  const width = 280;
  const height = 90;
  const stepX = width / (weeks.length - 1);

  const points = weeks.map((week, index) => {
    const x = index * stepX;
    const y = height - (week.cumulative / max) * (height - 16) - 8;
    return { x, y, week };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-28 w-full" role="img">
      <polyline points={polyline} fill="none" stroke="var(--color-primary)" strokeWidth={2} />
      {points.map((point) => (
        <circle key={point.week.end.toISOString()} cx={point.x} cy={point.y} r={2.5} fill="var(--color-primary)" />
      ))}
    </svg>
  );
}
