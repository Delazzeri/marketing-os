"use client";

import type { WidgetProps } from "./types";

export function CountersWidget({ config, columns, items }: WidgetProps) {
  const statusColumn = columns.find((c) => c.id === config.columnId) ?? columns.find((c) => c.type === "status");
  const total = items.length;
  const done = statusColumn
    ? items.filter((item) => item.values[statusColumn.id] === "Concluído").length
    : 0;
  const pending = total - done;

  const tiles = [
    { label: "Total", value: total },
    { label: "Concluídos", value: done },
    { label: "Em aberto", value: pending },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {tiles.map((tile) => (
        <div key={tile.label} className="flex flex-col items-center gap-0.5 rounded-lg bg-muted/50 py-3">
          <span className="text-2xl font-semibold tabular-nums">{tile.value}</span>
          <span className="text-[10px] text-muted-foreground">{tile.label}</span>
        </div>
      ))}
    </div>
  );
}
