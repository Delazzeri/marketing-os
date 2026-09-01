"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createGroup, type GroupFormState } from "@/lib/actions/items";
import { ColorSwatchPicker } from "@/components/columns/ColorSwatchPicker";
import { COLOR_PALETTE } from "@/lib/column-types/color-palette";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const initialState: GroupFormState = {};

export function CreateGroupForm({ boardId }: { boardId: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createGroup.bind(null, boardId), initialState);
  const [color, setColor] = useState(COLOR_PALETTE[0]);
  const [wasPending, setWasPending] = useState(false);

  // Same render-time transition pattern used elsewhere in this repo (e.g.
  // InvitePersonModal): collapse the form back once the submit round-trips
  // successfully, without reaching for useEffect. CreateGroupForm lives
  // outside BoardContent's component tree (see page.tsx), so unlike
  // create/delete item it can't push into local state directly — router.refresh()
  // is the one mutation on this board page still doing a full re-fetch.
  const justSucceeded = wasPending && !pending && !state.error && open;
  if (wasPending !== pending) {
    setWasPending(pending);
    if (justSucceeded) setOpen(false);
  }

  // router.refresh() touches Next's Router state, which React doesn't allow
  // during another component's render — has to run in an effect, not inline
  // above, or it throws "Cannot update a component while rendering a
  // different component" (Router / CreateGroupForm).
  useEffect(() => {
    if (justSucceeded) router.refresh();
  }, [justSucceeded, router]);

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
