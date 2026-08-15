"use client";

import { useActionState } from "react";
import { createBoard, type BoardFormState } from "@/lib/actions/boards";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const initialState: BoardFormState = {};

export function CreateBoardForm({ workspaceSlug }: { workspaceSlug: string }) {
  const [state, formAction, pending] = useActionState(
    createBoard.bind(null, workspaceSlug),
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <Input name="name" placeholder="Nome do board" required />
      <Input name="slug" placeholder="identificador (ex: cliente-x)" required />
      <Button type="submit" disabled={pending}>
        {pending ? "Criando..." : "Criar board"}
      </Button>
      {state.error && <p className="text-sm text-destructive sm:self-center">{state.error}</p>}
    </form>
  );
}
