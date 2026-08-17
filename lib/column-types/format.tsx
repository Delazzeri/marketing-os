"use client";

import { formatValueSchema, type FormatValue } from "./schemas";
import type {
  ColumnConfig,
  ColumnTypeDefinition,
  EditorProps,
  TableCellProps,
} from "./types";

export { formatValueSchema, type FormatValue } from "./schemas";

export interface FormatOption {
  label: string;
  color: string;
}

export interface FormatColumnConfig extends ColumnConfig {
  options: FormatOption[];
}

function findOption(config: ColumnConfig, value: string | null): FormatOption | null {
  const options = (config as FormatColumnConfig).options ?? [];
  return options.find((option) => option.label === value) ?? null;
}

function FormatTableCell({ value, config }: TableCellProps<FormatValue>) {
  const option = findOption(config, value);
  if (!option) return null;

  return (
    <span
      className="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
      style={{ backgroundColor: option.color }}
    >
      {option.label}
    </span>
  );
}

function FormatCalendarBadge({ value, config }: TableCellProps<FormatValue>) {
  const option = findOption(config, value);
  if (!option) return null;

  return (
    <span
      className="inline-block h-2 w-2 rounded-full"
      style={{ backgroundColor: option.color }}
      title={option.label}
    />
  );
}

function FormatEditor({ value, config, onCommit, onCancel }: EditorProps<FormatValue>) {
  const options = (config as FormatColumnConfig).options ?? [];

  return (
    <select
      autoFocus
      defaultValue={value ?? ""}
      onChange={(event) => onCommit(event.target.value || null)}
      onBlur={onCancel}
      onKeyDown={(event) => {
        if (event.key === "Escape") onCancel();
      }}
      className="w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
    >
      <option value="">—</option>
      {options.map((option) => (
        <option key={option.label} value={option.label}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export const formatColumnType: ColumnTypeDefinition<FormatValue> = {
  validate: formatValueSchema,
  renderTableCell: FormatTableCell,
  renderEditor: FormatEditor,
  renderCalendarBadge: FormatCalendarBadge,
};
