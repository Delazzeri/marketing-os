"use client";

import { useTransition } from "react";
import { deleteGroup } from "@/lib/actions/items";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function DeleteGroupButton({ groupId }: { groupId: number }) {
  const [, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={() => startTransition(() => deleteGroup(groupId))}
      className="text-muted-foreground hover:text-destructive"
      title="Excluir grupo"
    >
      <Trash2 />
    </Button>
  );
}
