"use client";

import { useState, useTransition } from "react";
import { columnTypeRegistry, type ColumnType } from "@/lib/column-types/registry";
import type { ColumnConfig } from "@/lib/column-types/types";
import { updateItemValue } from "@/lib/actions/columns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Column types whose renderEditor is a small floating panel (options list,
// url+label, whatsapp fields...) rather than a full-width inline control —
// these open inside a Popover so they don't get clipped by the table's
// overflow-x scroll container or shove row height around. Types with a
// natively-sized inline editor (text/date/number use native inputs sized to
// the cell; check has no visible editor at all) render in-flow instead.
const POPOVER_EDITOR_TYPES: ColumnType[] = ["status", "format", "select", "link", "people", "whatsapp", "date"];

export function EditableCell({
  itemId,
  columnId,
  columnType,
  config,
  value,
  canEdit = true,
}: {
  itemId: number;
  columnId: number;
  columnType: ColumnType;
  config: ColumnConfig;
  value: unknown;
  canEdit?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [, startTransition] = useTransition();
  const definition = columnTypeRegistry[columnType];
  const Cell = definition.renderTableCell;
  const Editor = definition.renderEditor;

  function commit(nextValue: unknown) {
    setEditing(false);
    startTransition(() => {
      updateItemValue(itemId, columnId, nextValue);
    });
  }

  if (!canEdit) {
    return (
      <div className="flex min-h-[28px] w-full items-center px-1 text-left">
        <Cell value={value ?? null} config={config} />
      </div>
    );
  }

  const trigger = (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="flex min-h-[28px] w-full items-center rounded px-1 text-left hover:bg-accent"
    >
      <Cell value={value ?? null} config={config} />
    </button>
  );

  if (POPOVER_EDITOR_TYPES.includes(columnType)) {
    return (
      <Popover open={editing} onOpenChange={setEditing}>
        <PopoverTrigger render={trigger} />
        <PopoverContent align="start" className="w-auto p-0">
          <Editor value={value ?? null} config={config} onCancel={() => setEditing(false)} onCommit={commit} />
        </PopoverContent>
      </Popover>
    );
  }

  if (editing) {
    return <Editor value={value ?? null} config={config} onCancel={() => setEditing(false)} onCommit={commit} />;
  }

  return trigger;
}
