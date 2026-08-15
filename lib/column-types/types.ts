import type { ComponentType } from "react";
import type { z } from "zod";

export interface ColumnConfig {
  [key: string]: unknown;
}

export interface TableCellProps<TValue> {
  value: TValue | null;
  config: ColumnConfig;
}

export interface CalendarBadgeProps<TValue> {
  value: TValue | null;
  config: ColumnConfig;
}

export interface EditorProps<TValue> {
  value: TValue | null;
  config: ColumnConfig;
  onCommit: (value: TValue | null) => void;
  onCancel: () => void;
}

export interface ColumnTypeDefinition<TValue = unknown> {
  validate: z.ZodType<TValue>;
  renderTableCell: ComponentType<TableCellProps<TValue>>;
  renderEditor: ComponentType<EditorProps<TValue>>;
  renderCalendarBadge?: ComponentType<CalendarBadgeProps<TValue>>;
}
