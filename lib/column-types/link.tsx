"use client";

import { useState } from "react";
import { linkValueSchema, type LinkValue } from "./schemas";
import type { ColumnTypeDefinition, EditorProps, TableCellProps } from "./types";
import { Input } from "@/components/ui/input";

export { linkValueSchema, type LinkValue } from "./schemas";

function LinkTableCell({ value }: TableCellProps<LinkValue>) {
  if (!value) return null;
  return (
    <a
      href={value.url}
      target="_blank"
      rel="noopener noreferrer"
      className="truncate text-sm text-primary underline-offset-2 hover:underline"
      onClick={(event) => event.stopPropagation()}
    >
      {value.label || value.url}
    </a>
  );
}

function LinkEditor({ value, onCommit, onCancel }: EditorProps<LinkValue>) {
  const [url, setUrl] = useState(value?.url ?? "");
  const [label, setLabel] = useState(value?.label ?? "");

  function commit() {
    const parsed = linkValueSchema.safeParse({ url, label: label || undefined });
    if (!parsed.success) {
      onCancel();
      return;
    }
    onCommit(parsed.data);
  }

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-popover p-1.5 shadow-md">
      <Input
        autoFocus
        placeholder="https://..."
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") commit();
          if (event.key === "Escape") onCancel();
        }}
        className="h-7"
      />
      <Input
        placeholder="Rótulo (opcional)"
        value={label}
        onChange={(event) => setLabel(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") commit();
          if (event.key === "Escape") onCancel();
        }}
        onBlur={commit}
        className="h-7"
      />
    </div>
  );
}

export const linkColumnType: ColumnTypeDefinition<LinkValue> = {
  validate: linkValueSchema,
  renderTableCell: LinkTableCell,
  renderEditor: LinkEditor,
};
