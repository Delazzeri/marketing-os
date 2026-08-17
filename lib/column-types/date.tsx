"use client";

import { useState } from "react";
import { dateValueSchema, type DateValue } from "./schemas";
import type { ColumnTypeDefinition, EditorProps, TableCellProps } from "./types";
import { monthGridDays, toISODate, WEEKDAY_LABELS } from "@/lib/date-grid";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export { dateValueSchema, type DateValue } from "./schemas";

function formatDate(value: DateValue): string {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function DateTableCell({ value }: TableCellProps<DateValue>) {
  if (!value) return null;
  return <span className="text-sm tabular-nums">{formatDate(value)}</span>;
}

function DateCalendarBadge({ value }: TableCellProps<DateValue>) {
  if (!value) return null;
  return <span className="text-xs tabular-nums">{formatDate(value)}</span>;
}

function DateEditor({ value, onCommit }: EditorProps<DateValue>) {
  const initial = value ? new Date(`${value}T00:00:00`) : new Date();
  const [reference, setReference] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));
  const days = monthGridDays(reference);
  const currentMonth = reference.getMonth();

  return (
    <div className="w-64 p-2">
      <div className="mb-1.5 flex items-center justify-between px-1">
        <Button type="button" variant="ghost" size="icon-xs" onClick={() => setReference(new Date(reference.getFullYear(), reference.getMonth() - 1, 1))}>
          <ChevronLeft />
        </Button>
        <span className="text-xs font-medium capitalize">
          {reference.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
        </span>
        <Button type="button" variant="ghost" size="icon-xs" onClick={() => setReference(new Date(reference.getFullYear(), reference.getMonth() + 1, 1))}>
          <ChevronRight />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] text-muted-foreground">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className="py-0.5">
            {label}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day) => {
          const iso = toISODate(day);
          const inCurrentMonth = day.getMonth() === currentMonth;
          const selected = iso === value;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onCommit(iso)}
              className={cn(
                "rounded-md py-1 text-xs hover:bg-accent",
                inCurrentMonth ? "text-foreground" : "text-muted-foreground/50",
                selected && "bg-primary text-primary-foreground hover:bg-primary",
              )}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
      {value && (
        <Button type="button" variant="ghost" size="sm" onClick={() => onCommit(null)} className="mt-1 w-full text-xs text-muted-foreground">
          Limpar
        </Button>
      )}
    </div>
  );
}

export const dateColumnType: ColumnTypeDefinition<DateValue> = {
  validate: dateValueSchema,
  renderTableCell: DateTableCell,
  renderEditor: DateEditor,
  renderCalendarBadge: DateCalendarBadge,
};
