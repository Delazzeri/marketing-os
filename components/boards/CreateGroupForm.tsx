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
  const [state, formAction, pending] = useActionState(createGroup.bind(null, boardId), initialState);
  const [color, setColor] = useState(COLOR_PALETTE[0]);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="color" value={color} />
      <ColorSwatchPicker value={color} onChange={setColor} />
      <Input name="name" placeholder="Nome do grupo" required className="max-w-xs" />
      <Button type="submit" variant="outline" disabled={pending}>
        <Plus />
        {pending ? "Criando..." : "Grupo"}
      </Button>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
