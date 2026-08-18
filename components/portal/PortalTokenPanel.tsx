import { getPortalTokens } from "@/lib/actions/portal";
import { PortalTokenList } from "@/components/portal/PortalTokenList";

export async function PortalTokenPanel({ boardId }: { boardId: number }) {
  const tokens = await getPortalTokens(boardId);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">
        Gere um link somente-leitura para o cliente acompanhar este board sem precisar de conta.
      </p>
      <PortalTokenList boardId={boardId} tokens={tokens} />
    </div>
  );
}
