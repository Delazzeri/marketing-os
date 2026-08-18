"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ColumnConfig, EditorProps } from "./types";

export interface SelectableOption {
  label: string;
  color: string;
}

// Shared by status/select/format — replaces a native <select>. Each option
// is a plain button calling onCommit directly on click, with no onBlur:
// the native <select>'s blur fired before/alongside its change event in
// several browser/OS combos, so onCancel closed the editor before the
// selection ever committed, looking like the dropdown was "stuck" and not
// saving. Buttons sidestep that race entirely.
export function OptionEditor({ value, config, onCommit }: EditorProps<string>) {
  const options = (config as ColumnConfig & { options?: SelectableOption[] }).options ?? [];

  return (
    <div className="flex min-w-[180px] flex-col gap-0.5 p-1">
      <button
        type="button"
        onClick={() => onCommit(null)}
        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-accent"
      >
        — Limpar
      </button>
      {options.map((option) => (
        <button
          key={option.label}
          type="button"
          onClick={() => onCommit(option.label)}
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent",
          )}
        >
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: option.color }} />
          <span className="flex-1 truncate">{option.label}</span>
          {value === option.label && <Check className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
        </button>
      ))}
    </div>
  );
}
