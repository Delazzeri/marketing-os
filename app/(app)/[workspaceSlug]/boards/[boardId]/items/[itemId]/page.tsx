import Link from "next/link";
import { ItemPanel } from "@/components/items/ItemPanel";
import { ArrowLeft } from "lucide-react";

export default async function ItemPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; boardId: string; itemId: string }>;
}) {
  const { workspaceSlug, boardId, itemId } = await params;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-8">
      <Link
        href={`/${workspaceSlug}/boards/${boardId}`}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        voltar
      </Link>
      <ItemPanel workspaceSlug={workspaceSlug} boardId={Number(boardId)} itemId={Number(itemId)} />
    </div>
  );
}
