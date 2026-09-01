"use client";

import { useTransition } from "react";
import { deleteGroup } from "@/lib/actions/items";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

export function DeleteGroupButton({
  groupId,
  groupName,
  onDeleted,
}: {
  groupId: number;
  groupName: string;
  onDeleted?: (groupId: number) => void;
}) {
  const [, startTransition] = useTransition();

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-destructive"
            title="Excluir grupo"
          >
            <Trash2 />
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Apagar grupo &ldquo;{groupName}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            Todos os itens deste grupo serão apagados junto. Essa ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() =>
              onDeleted ? onDeleted(groupId) : startTransition(() => deleteGroup(groupId))
            }
          >
            Apagar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
