"use client";

import { useState } from "react";
import { textValueSchema, type TextValue } from "./schemas";
import type { ColumnTypeDefinition, EditorProps, TableCellProps } from "./types";

export { textValueSchema, type TextValue } from "./schemas";

function TextTableCell({ value }: TableCellProps<TextValue>) {
  return <span className="truncate text-sm">{value}</span>;
}

// Caption-style free text (e.g. Legenda) tends to run longer than a single
// line, so the editor is a textarea that grows with content and sits over
// the cell, rather than the fixed-height Input other editors use.
function TextEditor({ value, onCommit, onCancel }: EditorProps<TextValue>) {
  const [draft, setDraft] = useState(value ?? "");

  return (
    <textarea
      autoFocus
      rows={1}
      value={draft}
      onChange={(event) => {
        setDraft(event.target.value);
        event.target.style.height = "auto";
        event.target.style.height = `${event.target.scrollHeight}px`;
      }}
      onFocus={(event) => {
        event.target.style.height = "auto";
        event.target.style.height = `${event.target.scrollHeight}px`;
      }}
      onBlur={() => onCommit(draft || null)}
      onKeyDown={(event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          onCommit(draft || null);
        }
        if (event.key === "Escape") onCancel();
      }}
      className="relative z-10 min-h-[28px] w-full resize-none overflow-hidden rounded-md border border-ring bg-popover px-1.5 py-1 text-sm text-popover-foreground shadow-md outline-none"
    />
  );
}

export const textColumnType: ColumnTypeDefinition<TextValue> = {
  validate: textValueSchema,
  renderTableCell: TextTableCell,
  renderEditor: TextEditor,
};
