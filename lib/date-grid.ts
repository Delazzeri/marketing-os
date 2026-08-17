export function startOfMonthGrid(reference: Date): Date {
  const firstOfMonth = new Date(reference.getFullYear(), reference.getMonth(), 1);
  const weekday = firstOfMonth.getDay();
  const start = new Date(firstOfMonth);
  start.setDate(firstOfMonth.getDate() - weekday);
  return start;
}

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function monthGridDays(reference: Date): Date[] {
  const gridStart = startOfMonthGrid(reference);
  return Array.from({ length: 42 }, (_, i) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + i);
    return day;
  });
}

export const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
