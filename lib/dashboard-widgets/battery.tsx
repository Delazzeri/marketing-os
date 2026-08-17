"use client";

import type { WidgetProps } from "./types";

// "Done" heuristic: a status column option literally named "Concluído" (the
// only status label the app ships/automations reference today — see
// lib/actions/automations.ts's show_in_portal_update trigger). If the board
// renamed that option or has none, the widget just reports 0/total.
function isDoneValue(column: WidgetProps["columns"][number] | undefined, value: unknown): boolean {
  if (!column || typeof value !== "string") return false;
  return value === "Concluído";
}

export function BatteryWidget({ config, columns, items }: WidgetProps) {
  const column = columns.find((c) => c.id === config.columnId) ?? columns.find((c) => c.type === "status");
  const total = items.length;
  const done = column ? items.filter((item) => isDoneValue(column, item.values[column.id])).length : 0;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 120 70" className="h-20 w-32" role="img">
        <rect x={2} y={2} width={108} height={56} rx={8} fill="none" stroke="currentColor" strokeOpacity={0.2} strokeWidth={3} />
        <rect x={110} y={20} width={8} height={20} rx={2} fill="currentColor" fillOpacity={0.2} />
        <rect
          x={6}
          y={6}
          width={Math.max(0, (percent / 100) * 100)}
          height={48}
          rx={5}
          fill="var(--color-primary)"
        />
        <text x={56} y={36} textAnchor="middle" fontSize="20" fontWeight={600} fill="currentColor">
          {percent}%
        </text>
      </svg>
      <p className="text-xs text-muted-foreground">
        {done} de {total} concluídos
      </p>
    </div>
  );
}
