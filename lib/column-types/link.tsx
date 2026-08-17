"use client";

import { useState } from "react";
import { linkValueSchema, type LinkValue } from "./schemas";
import type { ColumnTypeDefinition, EditorProps, TableCellProps } from "./types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";

export { linkValueSchema, type LinkValue } from "./schemas";

// The pill's own click opens the editor (default EditableCell behavior via
// the outer trigger button) so a set link stays editable; only the ↗ icon
// navigates, with its own stopPropagation so it doesn't also open the editor.
function LinkTableCell({ value }: TableCellProps<LinkValue>) {
  if (!value) return null;
  return (
    <span className="inline-flex max-w-full items-center gap-1 truncate rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
      <span className="truncate">{value.label || value.url}</span>
      <a
        href={value.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(event) => event.stopPropagation()}
        className="shrink-0 hover:opacity-70"
        aria-label="Abrir link"
      >
        <ArrowUpRight className="h-3 w-3" />
      </a>
    </span>
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
    <div className="flex w-64 flex-col gap-1.5 p-1">
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
        className="h-7"
      />
      <div className="flex justify-end gap-1.5 pt-0.5">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="button" size="sm" onClick={commit}>
          Aplicar
        </Button>
      </div>
    </div>
  );
}

export const linkColumnType: ColumnTypeDefinition<LinkValue> = {
  validate: linkValueSchema,
  renderTableCell: LinkTableCell,
  renderEditor: LinkEditor,
};
