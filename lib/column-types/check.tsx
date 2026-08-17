"use client";

import { useEffect } from "react";
import { checkValueSchema, type CheckValue } from "./schemas";
import type { ColumnTypeDefinition, EditorProps, TableCellProps } from "./types";
import { Check } from "lucide-react";

export { checkValueSchema, type CheckValue } from "./schemas";

function CheckTableCell({ value }: TableCellProps<CheckValue>) {
  return (
    <span
      className={
        value
          ? "flex h-4 w-4 items-center justify-center rounded border border-primary bg-primary text-primary-foreground"
          : "flex h-4 w-4 items-center justify-center rounded border border-input"
      }
    >
      {value && <Check className="h-3 w-3" />}
    </span>
  );
}

// There's no meaningful "editing" state for a checkbox — a click on the cell
// should just flip the value. EditableCell always mounts renderEditor first,
// so this commits once on mount (toggling immediately) rather than rendering
// a separate edit UI.
function CheckEditor({ value, onCommit }: EditorProps<CheckValue>) {
  useEffect(() => {
    onCommit(!value);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire-once toggle on mount, not a value sync
  }, []);
  return null;
}

export const checkColumnType: ColumnTypeDefinition<CheckValue> = {
  validate: checkValueSchema,
  renderTableCell: CheckTableCell,
  renderEditor: CheckEditor,
};
