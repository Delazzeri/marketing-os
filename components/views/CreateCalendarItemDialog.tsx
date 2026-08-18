"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { quickCreateItemWithDate } from "@/lib/actions/items";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CreateCalendarItemDialog({
  open,
  onOpenChange,
  workspaceSlug,
  boardId,
  groupId,
  dateColumnId,
  isoDate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceSlug: string;
  boardId: number;
  groupId: number;
  dateColumnId: number;
  isoDate: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [pending, setPending] = useState(false);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    setPending(true);
    startTransition(async () => {
      try {
        const itemId = await quickCreateItemWithDate(boardId, groupId, trimmed, dateColumnId, isoDate);
        setTitle("");
        onOpenChange(false);
        router.push(`/${workspaceSlug}/boards/${boardId}/items/${itemId}`);
      } finally {
        setPending(false);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setTitle("");
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Nome do item"
            required
            autoFocus
          />
          <Button type="submit" disabled={pending}>
            {pending ? "Criando..." : "Criar item"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
