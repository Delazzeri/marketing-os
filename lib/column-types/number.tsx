"use client";

import { useState } from "react";
import { numberValueSchema, type NumberValue } from "./schemas";
import type { ColumnTypeDefinition, EditorProps, TableCellProps } from "./types";
import { Input } from "@/components/ui/input";

export { numberValueSchema, type NumberValue } from "./schemas";

function NumberTableCell({ value }: TableCellProps<NumberValue>) {
  if (value === null) return null;
  return <span className="text-sm tabular-nums">{value}</span>;
}

function NumberEditor({ value, onCommit, onCancel }: EditorProps<NumberValue>) {
  const [draft, setDraft] = useState(value !== null ? String(value) : "");

  function commit() {
    if (draft.trim() === "") {
      onCommit(null);
      return;
    }
    const parsed = Number(draft);
    if (Number.isNaN(parsed)) {
      onCancel();
      return;
    }
    onCommit(parsed);
  }

  return (
    <Input
      autoFocus
      type="number"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") commit();
        if (event.key === "Escape") onCancel();
      }}
      className="h-7"
    />
  );
}

export const numberColumnType: ColumnTypeDefinition<NumberValue> = {
  validate: numberValueSchema,
  renderTableCell: NumberTableCell,
  renderEditor: NumberEditor,
};
