"use client";

import { columnTypeRegistry } from "@/lib/column-types/registry";
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
  values: Record<string, unknown>;
}

export function PortalTable({ columns, items }: { columns: ColumnData[]; items: ItemData[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="min-w-[200px] px-3 py-2 text-left font-medium text-muted-foreground">Item</th>
            {columns.map((column) => (
              <th key={column.id} className="min-w-[160px] px-3 py-2 text-left font-medium text-muted-foreground">
                {column.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-border/60 last:border-0">
              <td className="px-3 py-1.5">{item.title}</td>
              {columns.map((column) => {
                const Cell = columnTypeRegistry[column.type].renderTableCell;
                return (
                  <td key={column.id} className="px-3 py-1.5">
                    <Cell value={item.values[column.id] as never} config={column.config} />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
