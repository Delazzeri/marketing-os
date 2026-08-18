"use client";

import { useActionState, useState } from "react";
import { createGroup, type GroupFormState } from "@/lib/actions/items";
import { ColorSwatchPicker } from "@/components/columns/ColorSwatchPicker";
import { COLOR_PALETTE } from "@/lib/column-types/color-palette";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const initialState: GroupFormState = {};

export function CreateGroupForm({ boardId }: { boardId: number }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createGroup.bind(null, boardId), initialState);
  const [color, setColor] = useState(COLOR_PALETTE[0]);
  const [wasPending, setWasPending] = useState(false);

  // Same render-time transition pattern used elsewhere in this repo (e.g.
  // InvitePersonModal): collapse the form back once the submit round-trips
  // successfully, without reaching for useEffect.
  if (wasPending !== pending) {
    setWasPending(pending);
    if (wasPending && !pending && !state.error && open) setOpen(false);
  }

  if (!open) {
    return (
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Plus />
        Adicionar grupo
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="color" value={color} />
      <ColorSwatchPicker value={color} onChange={setColor} />
      <Input name="name" placeholder="Nome do grupo" required autoFocus className="max-w-xs" />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Criando..." : "Criar"}
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
        Cancelar
      </Button>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
