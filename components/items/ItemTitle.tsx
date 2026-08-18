"use client";

import { useRef, useState, useTransition } from "react";
import { renameItem } from "@/lib/actions/items";

export function ItemTitle({
  itemId,
  title,
  autoFocus = false,
}: {
  itemId: number;
  title: string;
  autoFocus?: boolean;
}) {
  const [editing, setEditing] = useState(autoFocus || !title);
  const [draft, setDraft] = useState(title);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== title) {
      setEditing(false);
      startTransition(() => renameItem(itemId, trimmed));
    } else if (trimmed) {
      setEditing(false);
    }
    // If still blank, stay in edit mode instead of reverting to an
    // unnamed item — items are created title-less by the calendar's
    // double-click flow and need a name before they're useful.
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
          if (event.key === "Escape" && title) {
            setDraft(title);
            setEditing(false);
          }
        }}
        placeholder="Nome do item"
        className="min-w-0 flex-1 rounded-md border border-ring bg-transparent px-1.5 py-0.5 text-xl font-semibold tracking-tight outline-none"
      />
    );
  }

  return (
    <h1
      onDoubleClick={() => {
        setDraft(title);
        setEditing(true);
      }}
      className="text-xl font-semibold tracking-tight"
    >
      {title}
    </h1>
  );
}
