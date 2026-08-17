"use client";

import { selectValueSchema, type SelectValue } from "./schemas";
import type {
  ColumnConfig,
  ColumnTypeDefinition,
  EditorProps,
  TableCellProps,
} from "./types";

export { selectValueSchema, type SelectValue } from "./schemas";

export interface SelectOption {
  label: string;
  color: string;
}

export interface SelectColumnConfig extends ColumnConfig {
  options: SelectOption[];
}

function findOption(config: ColumnConfig, value: string | null): SelectOption | null {
  const options = (config as SelectColumnConfig).options ?? [];
  return options.find((option) => option.label === value) ?? null;
}

function SelectTableCell({ value, config }: TableCellProps<SelectValue>) {
  const option = findOption(config, value);
  if (!option) return null;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: option.color }} />
      {option.label}
    </span>
  );
}

function SelectEditor({ value, config, onCommit, onCancel }: EditorProps<SelectValue>) {
  const options = (config as SelectColumnConfig).options ?? [];

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

export const selectColumnType: ColumnTypeDefinition<SelectValue> = {
  validate: selectValueSchema,
  renderTableCell: SelectTableCell,
  renderEditor: SelectEditor,
};
