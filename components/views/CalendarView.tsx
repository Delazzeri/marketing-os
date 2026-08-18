"use client";

import { useState } from "react";
import Link from "next/link";
import { columnTypeRegistry } from "@/lib/column-types/registry";
import type { ColumnType } from "@/lib/column-types/schemas";
import { monthGridDays, toISODate, WEEKDAY_LABELS } from "@/lib/date-grid";
import { CreateCalendarItemDialog } from "@/components/views/CreateCalendarItemDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ColumnData {
  id: number;
  name: string;
  type: ColumnType;
  config: Record<string, unknown>;
}

interface ItemData {
  id: number;
  title: string;
  values: Record<string, unknown>;
}

type CalendarMode = "month" | "week" | "day";

function startOfWeek(date: Date): Date {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  start.setHours(0, 0, 0, 0);
  return start;
}

function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(date.getDate() + amount);
  return next;
}

function StatusLegend({ statusColumn }: { statusColumn: ColumnData | undefined }) {
  if (!statusColumn) return null;
  const options = (statusColumn.config.options as { label: string; color: string }[] | undefined) ?? [];
  if (options.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
      {options.map((option) => (
        <span key={option.label} className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: option.color }} />
          {option.label}
        </span>
      ))}
    </div>
  );
}

function DayCell({
  day,
  inCurrentMonth,
  dayItems,
  workspaceSlug,
  boardId,
  dateColumn,
  statusColumn,
  firstGroupId,
  compact,
  onRequestCreate,
}: {
  day: Date;
  inCurrentMonth: boolean;
  dayItems: ItemData[];
  workspaceSlug: string;
  boardId: number;
  dateColumn: ColumnData;
  statusColumn: ColumnData | undefined;
  firstGroupId: number | null;
  compact: boolean;
  onRequestCreate: (day: Date) => void;
}) {
  const Badge = columnTypeRegistry[dateColumn.type].renderCalendarBadge;
  const statusOptions =
    (statusColumn?.config.options as { label: string; color: string }[] | undefined) ?? [];

  function statusColorFor(item: ItemData): string | null {
    if (!statusColumn) return null;
    const value = item.values[statusColumn.id];
    if (typeof value !== "string") return null;
    return statusOptions.find((option) => option.label === value)?.color ?? null;
  }

  return (
    <div
      className={`${compact ? "min-h-[140px]" : "min-h-[90px]"} border-b border-r border-border/60 p-1.5 ${
        inCurrentMonth ? "" : "bg-muted/30"
      }`}
      onDoubleClick={() => {
        if (firstGroupId) onRequestCreate(day);
      }}
    >
      <span className={`text-xs ${inCurrentMonth ? "text-foreground" : "text-muted-foreground"}`}>
        {day.getDate()}
      </span>
      <div className="mt-1 flex flex-col gap-0.5">
        {dayItems.map((item) => {
          const color = statusColorFor(item);
          return (
            <Link
              key={item.id}
              href={`/${workspaceSlug}/boards/${boardId}/items/${item.id}`}
              className={`flex items-center gap-1 truncate rounded px-1.5 py-0.5 text-xs font-medium ${
                color ? "text-white hover:opacity-90" : "hover:bg-accent"
              }`}
              style={color ? { backgroundColor: color } : undefined}
            >
              {!color && Badge && <Badge value={item.values[dateColumn.id] as never} config={dateColumn.config} />}
              <span className="truncate">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function CalendarView({
  boardId,
  workspaceSlug,
  dateColumn,
  items,
  groups,
  columns,
}: {
  boardId: number;
  workspaceSlug: string;
  dateColumn: ColumnData;
  items: ItemData[];
  groups: { id: number }[];
  columns: ColumnData[];
}) {
  const [mode, setMode] = useState<CalendarMode>("month");
  const [reference, setReference] = useState(() => new Date());
  const [creatingDate, setCreatingDate] = useState<Date | null>(null);

  const itemsByDate = new Map<string, ItemData[]>();
  for (const item of items) {
    const value = item.values[dateColumn.id];
    if (typeof value !== "string") continue;
    const list = itemsByDate.get(value) ?? [];
    list.push(item);
    itemsByDate.set(value, list);
  }

  const firstGroupId = groups[0]?.id ?? null;
  const statusColumn = columns.find((column) => column.type === "status");

  const days =
    mode === "month"
      ? monthGridDays(reference)
      : mode === "week"
        ? Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(reference), i))
        : [reference];
  const currentMonth = reference.getMonth();

  function navigate(amount: number) {
    setReference((prev) => {
      if (mode === "month") return new Date(prev.getFullYear(), prev.getMonth() + amount, 1);
      if (mode === "week") return addDays(prev, amount * 7);
      return addDays(prev, amount);
    });
  }

  const headerLabel =
    mode === "day"
      ? reference.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })
      : reference.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
            <ChevronLeft />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setReference(new Date())}>
            Hoje
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => navigate(1)}>
            <ChevronRight />
          </Button>
          <span className="text-sm font-medium capitalize">{headerLabel}</span>
        </div>
        <Tabs value={mode} onValueChange={(value) => setMode(value as CalendarMode)}>
          <TabsList>
            <TabsTrigger value="month">Mês</TabsTrigger>
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="day">Dia</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <StatusLegend statusColumn={statusColumn} />

      <div className="overflow-hidden rounded-lg border border-border">
        {mode !== "day" && (
          <div className="grid grid-cols-7 border-b border-border bg-muted/50 text-xs font-medium text-muted-foreground">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="px-2 py-1.5">
                {label}
              </div>
            ))}
          </div>
        )}
        <div className={mode === "day" ? "grid grid-cols-1" : "grid grid-cols-7"}>
          {days.map((day) => {
            const iso = toISODate(day);
            const dayItems = itemsByDate.get(iso) ?? [];
            const inCurrentMonth = mode !== "month" || day.getMonth() === currentMonth;

            return (
              <DayCell
                key={iso}
                day={day}
                inCurrentMonth={inCurrentMonth}
                dayItems={dayItems}
                workspaceSlug={workspaceSlug}
                boardId={boardId}
                dateColumn={dateColumn}
                statusColumn={statusColumn}
                firstGroupId={firstGroupId}
                compact={mode !== "month"}
                onRequestCreate={setCreatingDate}
              />
            );
          })}
        </div>
      </div>

      {firstGroupId && creatingDate && (
        <CreateCalendarItemDialog
          open={Boolean(creatingDate)}
          onOpenChange={(open) => {
            if (!open) setCreatingDate(null);
          }}
          workspaceSlug={workspaceSlug}
          boardId={boardId}
          groupId={firstGroupId}
          dateColumnId={dateColumn.id}
          isoDate={toISODate(creatingDate)}
        />
      )}
    </div>
  );
}
