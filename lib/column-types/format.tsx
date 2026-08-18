"use client";

import { formatValueSchema, type FormatValue } from "./schemas";
import { OptionEditor } from "./option-editor";
import type {
  ColumnConfig,
  ColumnTypeDefinition,
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

export const formatColumnType: ColumnTypeDefinition<FormatValue> = {
  validate: formatValueSchema,
  renderTableCell: FormatTableCell,
  renderEditor: OptionEditor,
  renderCalendarBadge: FormatCalendarBadge,
};
