"use client";

import { useActionState, useEffect } from "react";
import { createItem, type ItemFormState } from "@/lib/actions/items";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const initialState: ItemFormState = {};

export function CreateItemForm({
  boardId,
  groupId,
  onCreated,
}: {
  boardId: number;
  groupId: number;
  onCreated?: (item: { id: number; title: string; groupId: number }) => void;
}) {
  const [state, formAction, pending] = useActionState(createItem.bind(null, boardId), initialState);

  // onCreated pushes into BoardContent's state, a different component —
  // React forbids that inline during this component's own render (throws
  // "Cannot update a component while rendering a different component", and
  // in practice double-fires the update, duplicating the row). Has to run
  // in an effect instead.
  useEffect(() => {
    if (state.item) onCreated?.(state.item);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} data-tour="new-item" className="flex items-center gap-2 px-1">
      <input type="hidden" name="groupId" value={groupId} />
      <Input name="title" placeholder="Novo item" required className="max-w-sm" />
      <Button type="submit" variant="ghost" size="icon" disabled={pending}>
        <Plus />
      </Button>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
