"use client";

import { useTransition } from "react";
import { deleteItemUpdate } from "@/lib/actions/item-updates";
import type { WorkspaceMember } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { avatarColorFor } from "@/lib/avatar-color";
import { X } from "lucide-react";

interface UpdateRow {
  id: number;
  author_id: string | null;
  body: string;
  created_at: string;
  mentioned_user_ids: string[];
}

function DeleteButton({ updateId }: { updateId: number }) {
  const [, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      onClick={() => startTransition(() => deleteItemUpdate(updateId))}
      className="text-muted-foreground/50 hover:text-destructive"
      title="Excluir atualização"
    >
      <X />
    </Button>
  );
}

function renderBody(body: string, members: WorkspaceMember[]) {
  if (members.length === 0) return body;
  const names = members.map((m) => m.name).sort((a, b) => b.length - a.length);
  const pattern = new RegExp(`@(${names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g");
  const parts = body.split(pattern);
  return parts.map((part, index) =>
    names.includes(part) ? (
      <span key={index} className="font-medium text-primary">
        @{part}
      </span>
    ) : (
      part
    ),
  );
}

export function UpdatesFeed({
  updates,
  members,
}: {
  updates: UpdateRow[];
  members: WorkspaceMember[];
}) {
  if (updates.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma atualização ainda.</p>;
  }

  function member(userId: string | null) {
    return members.find((m) => m.userId === userId);
  }

  return (
    <ul className="flex flex-col gap-3">
      {updates.map((update) => {
        const author = member(update.author_id);
        const authorName = author?.name ?? "Sistema";

        return (
          <li key={update.id} className="flex gap-2 text-sm">
            <Avatar size="sm" className="mt-0.5">
              <AvatarFallback
                className="text-[10px] font-medium text-white"
                style={{ backgroundColor: avatarColorFor(authorName) }}
              >
                {authorName.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>
                  {authorName} · {new Date(update.created_at).toLocaleString("pt-BR")}
                </span>
                <DeleteButton updateId={update.id} />
              </div>
              <p className="whitespace-pre-wrap">{renderBody(update.body, members)}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
