import { ItemModalShell } from "@/components/items/ItemModalShell";
import { ItemPanel } from "@/components/items/ItemPanel";

export default async function ItemModal({
  params,
}: {
  params: Promise<{ workspaceSlug: string; boardId: string; itemId: string }>;
}) {
  const { workspaceSlug, boardId, itemId } = await params;

  return (
    <ItemModalShell>
      <ItemPanel workspaceSlug={workspaceSlug} boardId={Number(boardId)} itemId={Number(itemId)} />
    </ItemModalShell>
  );
}
