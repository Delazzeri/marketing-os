"use client";

import { useActionState, useEffect, useState } from "react";
import { createGroup, type GroupFormState } from "@/lib/actions/items";
import { ColorSwatchPicker } from "@/components/columns/ColorSwatchPicker";
import { COLOR_PALETTE } from "@/lib/column-types/color-palette";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const initialState: GroupFormState = {};

export function CreateGroupForm({
  boardId,
  onCreated,
}: {
  boardId: number;
  onCreated?: (group: { id: number; name: string; color: string | null }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createGroup.bind(null, boardId), initialState);
  const [color, setColor] = useState(COLOR_PALETTE[0]);
  const [wasPending, setWasPending] = useState(false);

  // Same render-time transition pattern used elsewhere in this repo (e.g.
  // InvitePersonModal): collapse the form back once the submit round-trips
  // successfully, without reaching for useEffect.
  const justSucceeded = wasPending && !pending && !state.error && open;
  if (wasPending !== pending) {
    setWasPending(pending);
    if (justSucceeded) setOpen(false);
  }

  // onCreated pushes into BoardWorkspace's state, a different component —
  // React forbids that inline during this component's own render (throws
  // "Cannot update a component while rendering a different component", and
  // in practice double-fires the update). Has to run in an effect instead.
  useEffect(() => {
    if (state.group) onCreated?.(state.group);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

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
