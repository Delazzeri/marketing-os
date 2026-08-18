"use client";

import { useActionState, useState } from "react";
import { updateUserCredentials, type AdminFormState } from "@/lib/actions/admin";
import { BoardSettingsDialog } from "@/components/boards/BoardSettingsDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

const initialState: AdminFormState = {};

export function EditUserCredentialsForm({ userId, currentEmail }: { userId: string; currentEmail: string }) {
  const [state, formAction, pending] = useActionState(updateUserCredentials.bind(null, userId), initialState);
  const [wasPending, setWasPending] = useState(false);
  const [open, setOpen] = useState(false);

  if (wasPending !== pending) {
    setWasPending(pending);
    if (wasPending && !pending && !state.error && open) setOpen(false);
  }

  return (
    <BoardSettingsDialog
      title="Editar credenciais"
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button type="button" variant="ghost" size="icon-xs" title="Editar email/senha">
          <Pencil />
        </Button>
      }
    >
      <form action={formAction} className="flex flex-col gap-3">
        <Input name="email" type="email" placeholder="Email" defaultValue={currentEmail} />
        <Input name="password" type="password" placeholder="Nova senha (opcional)" minLength={6} />
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar"}
        </Button>
        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      </form>
    </BoardSettingsDialog>
  );
}
