"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { quickCreateBoard } from "@/lib/actions/boards";
import type { BoardType } from "@/lib/validation/boards";
import { BoardSettingsDialog } from "@/components/boards/BoardSettingsDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const BOARD_TYPE_LABELS: Record<BoardType, string> = {
  standard: "Padrão",
  whiteboard: "Quadro branco",
};

export function CreateBoardDialog({
  workspaceSlug,
  folderId,
  trigger,
}: {
  workspaceSlug: string;
  folderId: number | null;
  trigger: React.ReactElement;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<BoardType>("standard");
  const [error, setError] = useState<string | undefined>();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    setPending(true);
    setError(undefined);
    startTransition(async () => {
      try {
        await quickCreateBoard(workspaceSlug, trimmedName, folderId, type);
        setOpen(false);
        setName("");
        setType("standard");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não foi possível criar o quadro.");
      } finally {
        setPending(false);
      }
    });
  }

  return (
    <BoardSettingsDialog title="Novo quadro" open={open} onOpenChange={setOpen} trigger={trigger}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nome do quadro"
          required
          autoFocus
        />
        <Select value={type} onValueChange={(value) => setType((value as BoardType) ?? "standard")}>
          <SelectTrigger className="w-full">
            <SelectValue>{BOARD_TYPE_LABELS[type]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="standard">Padrão</SelectItem>
            <SelectItem value="whiteboard">Quadro branco</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" disabled={pending}>
          {pending ? "Criando..." : "Criar quadro"}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </form>
    </BoardSettingsDialog>
  );
}
