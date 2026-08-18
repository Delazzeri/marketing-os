"use client";

import { useActionState, useState } from "react";
import { createWorkspace, type AdminFormState } from "@/lib/actions/admin";
import { BoardSettingsDialog } from "@/components/boards/BoardSettingsDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const initialState: AdminFormState = {};

export function CreateWorkspaceForm() {
  const [state, formAction, pending] = useActionState(createWorkspace, initialState);
  const [wasPending, setWasPending] = useState(false);
  const [open, setOpen] = useState(false);

  if (wasPending !== pending) {
    setWasPending(pending);
    if (wasPending && !pending && !state.error && open) setOpen(false);
  }

  return (
    <BoardSettingsDialog
      title="Nova empresa"
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button type="button">
          <Plus />
          Nova empresa
        </Button>
      }
    >
      <form action={formAction} className="flex flex-col gap-3">
        <Input name="name" placeholder="Nome da empresa" required autoFocus />
        <Input name="slug" placeholder="identificador (ex: cliente-x)" required />
        <Button type="submit" disabled={pending}>
          {pending ? "Criando..." : "Criar empresa"}
        </Button>
        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      </form>
    </BoardSettingsDialog>
  );
}
