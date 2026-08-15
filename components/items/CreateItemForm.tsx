"use client";

import { useActionState } from "react";
import { createItem, type ItemFormState } from "@/lib/actions/items";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const initialState: ItemFormState = {};

export function CreateItemForm({ boardId, groupId }: { boardId: number; groupId: number }) {
  const [state, formAction, pending] = useActionState(createItem.bind(null, boardId), initialState);

  return (
    <form action={formAction} className="flex items-center gap-2 px-1">
      <input type="hidden" name="groupId" value={groupId} />
      <Input name="title" placeholder="Novo item" required className="max-w-sm" />
      <Button type="submit" variant="ghost" size="icon" disabled={pending}>
        <Plus />
      </Button>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
