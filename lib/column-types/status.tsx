"use client";

import { statusValueSchema, type StatusValue } from "./schemas";
import type {
  ColumnConfig,
  ColumnTypeDefinition,
  EditorProps,
  TableCellProps,
} from "./types";

export { statusValueSchema, type StatusValue } from "./schemas";

export interface StatusOption {
  label: string;
  color: string;
}

export interface StatusColumnConfig extends ColumnConfig {
  options: StatusOption[];
}

function findOption(config: ColumnConfig, value: string | null): StatusOption | null {
  const options = (config as StatusColumnConfig).options ?? [];
  return options.find((option) => option.label === value) ?? null;
}

function StatusTableCell({ value, config }: TableCellProps<StatusValue>) {
  const option = findOption(config, value);
  if (!option) return null;

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
      style={{ backgroundColor: option.color }}
    >
      {option.label}
    </span>
  );
}

function StatusCalendarBadge({ value, config }: TableCellProps<StatusValue>) {
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

function StatusEditor({ value, config, onCommit, onCancel }: EditorProps<StatusValue>) {
  const options = (config as StatusColumnConfig).options ?? [];

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

export const statusColumnType: ColumnTypeDefinition<StatusValue> = {
  validate: statusValueSchema,
  renderTableCell: StatusTableCell,
  renderEditor: StatusEditor,
  renderCalendarBadge: StatusCalendarBadge,
};
