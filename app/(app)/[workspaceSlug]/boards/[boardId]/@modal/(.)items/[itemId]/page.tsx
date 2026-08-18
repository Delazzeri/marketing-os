import { ItemModalShell } from "@/components/items/ItemModalShell";
import { ItemPanel } from "@/components/items/ItemPanel";

export default async function ItemModal({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceSlug: string; boardId: string; itemId: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const { workspaceSlug, boardId, itemId } = await params;
  const { new: isNew } = await searchParams;

  return (
    <ItemModalShell>
      <ItemPanel
        workspaceSlug={workspaceSlug}
        boardId={Number(boardId)}
        itemId={Number(itemId)}
        autoFocusTitle={isNew === "1"}
      />
    </ItemModalShell>
  );
}
