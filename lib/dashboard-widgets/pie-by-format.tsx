"use client";

import { countByOption } from "./aggregate";
import { buildPieSlices } from "./pie-math";
import type { WidgetProps } from "./types";

export function PieByFormatWidget({ config, columns, items }: WidgetProps) {
  const column = columns.find((c) => c.id === config.columnId) ?? columns.find((c) => c.type === "format");
  const counts = countByOption(column, items);
  const slices = buildPieSlices(counts, 50, 50, 44);

  if (slices.length === 0) {
    return <p className="text-xs text-muted-foreground">Sem dados de formato ainda.</p>;
  }

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="h-32 w-32 shrink-0" role="img">
        {slices.map((slice) => (
          <path key={slice.label} d={slice.path} fill={slice.color} stroke="var(--color-popover)" strokeWidth={1} />
        ))}
      </svg>
      <ul className="flex flex-col gap-1 text-xs">
        {slices.map((slice) => (
          <li key={slice.label} className="flex items-center gap-1.5">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
            <span className="text-foreground">{slice.label}</span>
            <span className="text-muted-foreground">{slice.percent}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
