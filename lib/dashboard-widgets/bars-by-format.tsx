"use client";

import { countByOption } from "./aggregate";
import type { WidgetProps } from "./types";

export function BarsByFormatWidget({ config, columns, items }: WidgetProps) {
  const column = columns.find((c) => c.id === config.columnId) ?? columns.find((c) => c.type === "format");
  const counts = countByOption(column, items);

  if (counts.length === 0) {
    return <p className="text-xs text-muted-foreground">Sem dados de formato ainda.</p>;
  }

  const max = Math.max(...counts.map((c) => c.count));
  const barHeight = 96;

  return (
    <svg viewBox={`0 0 ${counts.length * 56} ${barHeight + 24}`} className="h-40 w-full" role="img">
      {counts.map((option, index) => {
        const height = max > 0 ? (option.count / max) * barHeight : 0;
        const x = index * 56 + 8;
        return (
          <g key={option.label}>
            <rect x={x} y={barHeight - height} width={32} height={height} rx={4} fill={option.color} />
            <text x={x + 16} y={barHeight - height - 6} textAnchor="middle" fontSize="10" fill="currentColor">
              {option.count}
            </text>
            <text x={x + 16} y={barHeight + 16} textAnchor="middle" fontSize="9" fill="currentColor" opacity={0.6}>
              {option.label.length > 8 ? `${option.label.slice(0, 7)}…` : option.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
