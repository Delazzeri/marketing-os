"use client";

import { statusValueSchema, type StatusValue } from "./schemas";
import { OptionEditor } from "./option-editor";
import type {
  ColumnConfig,
  ColumnTypeDefinition,
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

export const statusColumnType: ColumnTypeDefinition<StatusValue> = {
  validate: statusValueSchema,
  renderTableCell: StatusTableCell,
  renderEditor: OptionEditor,
  renderCalendarBadge: StatusCalendarBadge,
};
