import { getPortalTokens } from "@/lib/actions/portal";
import { PortalTokenList } from "@/components/portal/PortalTokenList";

export async function PortalTokenPanel({ boardId }: { boardId: number }) {
  const tokens = await getPortalTokens(boardId);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
      <h2 className="text-sm font-semibold text-muted-foreground">Portal do cliente</h2>
      <PortalTokenList boardId={boardId} tokens={tokens} />
    </div>
  );
}
