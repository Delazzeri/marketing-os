interface ItemUpdateRow {
  id: number;
  item_id: number;
  body: string;
  created_at: string;
}

interface ItemData {
  id: number;
  title: string;
}

export function PortalUpdatesFeed({
  items,
  updates,
}: {
  items: ItemData[];
  updates: ItemUpdateRow[];
}) {
  if (updates.length === 0) return null;

  const itemTitleById = new Map(items.map((item) => [item.id, item.title]));

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
      <h2 className="text-sm font-semibold text-muted-foreground">Atualizações</h2>
      <ul className="flex flex-col gap-3">
        {updates.map((update) => (
          <li key={update.id} className="text-sm">
            <div className="text-xs text-muted-foreground">
              {itemTitleById.get(update.item_id) ?? "Item"} ·{" "}
              {new Date(update.created_at).toLocaleString("pt-BR")}
            </div>
            <p>{update.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
