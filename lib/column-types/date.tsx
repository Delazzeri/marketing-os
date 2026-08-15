"use client";

import { dateValueSchema, type DateValue } from "./schemas";
import type { ColumnTypeDefinition, EditorProps, TableCellProps } from "./types";
import { Input } from "@/components/ui/input";

export { dateValueSchema, type DateValue } from "./schemas";

function formatDate(value: DateValue): string {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function DateTableCell({ value }: TableCellProps<DateValue>) {
  if (!value) return null;
  return <span className="text-sm tabular-nums">{formatDate(value)}</span>;
}

function DateCalendarBadge({ value }: TableCellProps<DateValue>) {
  if (!value) return null;
  return <span className="text-xs tabular-nums">{formatDate(value)}</span>;
}

function DateEditor({ value, onCommit, onCancel }: EditorProps<DateValue>) {
  return (
    <Input
      autoFocus
      type="date"
      defaultValue={value ?? ""}
      onChange={(event) => onCommit(event.target.value || null)}
      onBlur={onCancel}
      onKeyDown={(event) => {
        if (event.key === "Escape") onCancel();
      }}
      className="h-7"
    />
  );
}

export const dateColumnType: ColumnTypeDefinition<DateValue> = {
  validate: dateValueSchema,
  renderTableCell: DateTableCell,
  renderEditor: DateEditor,
  renderCalendarBadge: DateCalendarBadge,
};
