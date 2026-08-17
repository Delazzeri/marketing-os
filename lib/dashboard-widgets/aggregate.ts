import type { WidgetColumnData, WidgetItemData } from "./types";

export interface OptionCount {
  label: string;
  color: string;
  count: number;
}

/**
 * Counts items per option for a status/format/select column, keeping the
 * options' declared order and dropping options with zero items. Aggregation
 * happens in JS over already-fetched items (see CalendarView.tsx for the
 * same server-fetch-then-aggregate pattern) rather than SQL, since the
 * expected data volume (agency/freelancer boards) doesn't justify it.
 */
export function countByOption(column: WidgetColumnData | undefined, items: WidgetItemData[]): OptionCount[] {
  if (!column) return [];
  const options = (column.config.options as { label: string; color: string }[] | undefined) ?? [];
  const counts = new Map<string, number>();
  for (const item of items) {
    const value = item.values[column.id];
    if (typeof value === "string") counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return options
    .map((option) => ({ ...option, count: counts.get(option.label) ?? 0 }))
    .filter((option) => option.count > 0);
}

export function findOptionColumn(columns: WidgetColumnData[], columnId: number | undefined) {
  if (columnId) return columns.find((column) => column.id === columnId);
  return columns.find((column) => ["status", "format", "select"].includes(column.type));
}
