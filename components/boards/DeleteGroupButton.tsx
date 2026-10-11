"use client";

import { useState, useTransition } from "react";
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
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2 } from "lucide-react";

// Deleting a group takes every item in it along, so it lives behind a "⋯"
// menu instead of a bare trash icon in the group header — the row-level trash
// icons are the ones that delete a single item, and having a group-wide trash
// sitting right above them made it easy to wipe a whole group by mistake.
export function DeleteGroupButton({
  groupId,
  groupName,
  itemCount,
  onDeleted,
}: {
  groupId: number;
  groupName: string;
  itemCount: number;
  onDeleted?: (groupId: number) => void;
}) {
  const [, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground"
              title="Opções do grupo"
              aria-label="Opções do grupo"
            >
              <MoreHorizontal />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem variant="destructive" onClick={() => setConfirmOpen(true)}>
            <Trash2 />
            Excluir grupo
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir o grupo &ldquo;{groupName}&rdquo; inteiro?</AlertDialogTitle>
            <AlertDialogDescription>
              {itemCount > 0
                ? `${itemCount === 1 ? "O item" : `Os ${itemCount} itens`} deste grupo também ${itemCount === 1 ? "será apagado" : "serão apagados"}. `
                : ""}
              Essa ação não pode ser desfeita. Para apagar só um item, use a lixeira na linha dele.
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
              Excluir grupo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
