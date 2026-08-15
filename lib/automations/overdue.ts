interface ItemLike {
  id: number;
  values: Record<string, unknown>;
}

// Pure, read-time computation — due_date_passed is never persisted (no cron
// exists to reconcile stale state), so "atrasado" is always derived fresh.
export function isItemOverdue(item: ItemLike, dateColumnId: number): boolean {
  const value = item.values[dateColumnId];
  if (typeof value !== "string") return false;
  const today = new Date().toISOString().slice(0, 10);
  return value < today;
}

export function computeOverdueItemIds<T extends ItemLike>(
  items: T[],
  dateColumnId: number | undefined,
): Set<number> {
  if (!dateColumnId) return new Set();
  const overdue = new Set<number>();
  for (const item of items) {
    if (isItemOverdue(item, dateColumnId)) overdue.add(item.id);
  }
  return overdue;
}
