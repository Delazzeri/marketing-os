"use client";

import { useRef, useState, useTransition } from "react";
import { cn } from "@/lib/utils";

export function InlineEditableText({
  value,
  onCommit,
  className,
  inputClassName,
  readOnly = false,
}: {
  value: string;
  onCommit: (next: string) => void | Promise<void>;
  className?: string;
  inputClassName?: string;
  readOnly?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function commit() {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) {
      startTransition(() => onCommit(trimmed));
    } else {
      setDraft(value);
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        autoFocus
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            inputRef.current?.blur();
          }
          if (event.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className={cn(
          "min-w-0 rounded-md border border-ring bg-transparent px-1.5 py-0.5 text-sm outline-none",
          inputClassName,
        )}
      />
    );
  }

  return (
    <span
      // Renaming boards is used inside a <Link> (the sidebar row navigates
      // to the board). A dblclick is two click events, and the first one
      // fires the Link's navigation before the second completes — so a
      // single click on this span has to be swallowed too, not just the
      // dblclick, or the row navigates away before editing can start.
      onClick={
        readOnly
          ? undefined
          : (event) => {
              if (event.detail > 1) {
                event.preventDefault();
                event.stopPropagation();
              }
            }
      }
      onDoubleClick={
        readOnly
          ? undefined
          : (event) => {
              event.preventDefault();
              event.stopPropagation();
              setDraft(value);
              setEditing(true);
            }
      }
      className={cn("truncate", className)}
    >
      {value}
    </span>
  );
}
