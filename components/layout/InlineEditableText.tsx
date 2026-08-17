"use client";

import { useRef, useState, useTransition } from "react";
import { cn } from "@/lib/utils";

export function InlineEditableText({
  value,
  onCommit,
  className,
  inputClassName,
}: {
  value: string;
  onCommit: (next: string) => void | Promise<void>;
  className?: string;
  inputClassName?: string;
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
      onDoubleClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      className={cn("truncate", className)}
    >
      {value}
    </span>
  );
}
