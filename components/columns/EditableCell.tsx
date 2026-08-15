"use client";

import { useState, useTransition } from "react";
import { columnTypeRegistry, type ColumnType } from "@/lib/column-types/registry";
import type { ColumnConfig } from "@/lib/column-types/types";
import { updateItemValue } from "@/lib/actions/columns";

export function EditableCell({
  itemId,
  columnId,
  columnType,
  config,
  value,
}: {
  itemId: number;
  columnId: number;
  columnType: ColumnType;
  config: ColumnConfig;
  value: unknown;
}) {
  const [editing, setEditing] = useState(false);
  const [, startTransition] = useTransition();
  const definition = columnTypeRegistry[columnType];

  if (editing) {
    const Editor = definition.renderEditor;
    return (
      <Editor
        value={value ?? null}
        config={config}
        onCancel={() => setEditing(false)}
        onCommit={(nextValue) => {
          setEditing(false);
          startTransition(() => {
            updateItemValue(itemId, columnId, nextValue);
          });
        }}
      />
    );
  }

  const Cell = definition.renderTableCell;
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="flex min-h-[28px] w-full items-center rounded px-1 text-left hover:bg-accent"
    >
      <Cell value={value ?? null} config={config} />
    </button>
  );
}
