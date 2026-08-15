"use client";

import { useActionState, useTransition } from "react";
import {
  createPortalToken,
  revokePortalToken,
  type PortalTokenFormState,
} from "@/lib/actions/portal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link2 } from "lucide-react";

type PortalTokenRow = {
  id: number;
  token: string;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

const initialState: PortalTokenFormState = {};

function PortalTokenRow({ boardId, row }: { boardId: number; row: PortalTokenRow }) {
  const [, startTransition] = useTransition();
  const url = typeof window !== "undefined" ? `${window.location.origin}/portal/${row.token}` : "";
  const isRevoked = Boolean(row.revoked_at);
  const isExpired = Boolean(row.expires_at && new Date(row.expires_at) < new Date());

  return (
    <li className="flex items-center justify-between gap-2 text-sm">
      <div className="flex flex-col">
        <span className={isRevoked || isExpired ? "text-muted-foreground line-through" : ""}>
          /portal/{row.token}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Badge variant={isRevoked || isExpired ? "outline" : "secondary"} className="text-[10px]">
            {isRevoked ? "revogado" : isExpired ? "expirado" : "ativo"}
          </Badge>
          {row.expires_at ? `expira em ${new Date(row.expires_at).toLocaleDateString("pt-BR")}` : ""}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {!isRevoked && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigator.clipboard.writeText(url)}
          >
            copiar link
          </Button>
        )}
        {!isRevoked && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => startTransition(() => revokePortalToken(row.id, boardId))}
            className="text-muted-foreground hover:text-destructive"
          >
            revogar
          </Button>
        )}
      </div>
    </li>
  );
}

export function PortalTokenList({
  boardId,
  tokens,
}: {
  boardId: number;
  tokens: PortalTokenRow[];
}) {
  const [state, formAction, pending] = useActionState(
    createPortalToken.bind(null, boardId),
    initialState,
  );

  return (
    <div className="flex flex-col gap-2">
      {tokens.length > 0 && (
        <ul className="flex flex-col gap-1">
          {tokens.map((row) => (
            <PortalTokenRow key={row.id} boardId={boardId} row={row} />
          ))}
        </ul>
      )}

      <form action={formAction} className="flex items-center gap-2">
        <Input name="expiresAt" type="date" className="max-w-[180px]" />
        <Button type="submit" variant="outline" disabled={pending}>
          <Link2 />
          {pending ? "..." : "Gerar link do Portal"}
        </Button>
        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      </form>
    </div>
  );
}
