"use client";

import { useState } from "react";
import { textValueSchema, type TextValue } from "./schemas";
import type { ColumnTypeDefinition, EditorProps, TableCellProps } from "./types";
import { Input } from "@/components/ui/input";

export { textValueSchema, type TextValue } from "./schemas";

function TextTableCell({ value }: TableCellProps<TextValue>) {
  return <span className="truncate text-sm">{value}</span>;
}

function TextEditor({ value, onCommit, onCancel }: EditorProps<TextValue>) {
  const [draft, setDraft] = useState(value ?? "");

  return (
    <Input
      autoFocus
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => onCommit(draft || null)}
      onKeyDown={(event) => {
        if (event.key === "Enter") onCommit(draft || null);
        if (event.key === "Escape") onCancel();
      }}
      className="h-7"
    />
  );
}

export const textColumnType: ColumnTypeDefinition<TextValue> = {
  validate: textValueSchema,
  renderTableCell: TextTableCell,
  renderEditor: TextEditor,
};
