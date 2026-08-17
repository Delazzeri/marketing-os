"use client";

import { useState, useTransition } from "react";
import { createDashboard, deleteDashboard, renameDashboard } from "@/lib/actions/dashboards";
import { InlineEditableText } from "@/components/layout/InlineEditableText";
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
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardData {
  id: number;
  name: string;
}

export function DashboardTabs({
  boardId,
  dashboards,
  activeDashboardId,
  onSelect,
}: {
  boardId: number;
  dashboards: DashboardData[];
  activeDashboardId: number | null;
  onSelect: (id: number) => void;
}) {
  const [, startTransition] = useTransition();
  const [addingDashboard, setAddingDashboard] = useState(false);
  const [newName, setNewName] = useState("");

  async function submitNewDashboard() {
    const name = newName.trim();
    if (!name) {
      setAddingDashboard(false);
      return;
    }
    setAddingDashboard(false);
    setNewName("");
    const formData = new FormData();
    formData.set("name", name);
    startTransition(() => {
      void createDashboard(boardId, {}, formData);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {dashboards.map((dashboard) => {
        const isActive = dashboard.id === activeDashboardId;
        return (
          <div
            key={dashboard.id}
            className={cn(
              "group/dtab flex items-center gap-1 rounded-md border px-2 py-1 text-sm",
              isActive ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            <button type="button" onClick={() => onSelect(dashboard.id)}>
              <InlineEditableText
                value={dashboard.name}
                onCommit={(next) => renameDashboard(dashboard.id, next)}
              />
            </button>
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <button
                    type="button"
                    className="text-muted-foreground/50 opacity-0 hover:text-destructive group-hover/dtab:opacity-100"
                    title="Apagar dashboard"
                  >
                    <X className="h-3 w-3" />
                  </button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Apagar dashboard &ldquo;{dashboard.name}&rdquo;?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Todos os widgets deste dashboard serão apagados junto. Essa ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => startTransition(() => deleteDashboard(dashboard.id))}
                  >
                    Apagar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      })}

      {addingDashboard ? (
        <input
          autoFocus
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          onBlur={submitNewDashboard}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submitNewDashboard();
            }
            if (event.key === "Escape") {
              setAddingDashboard(false);
              setNewName("");
            }
          }}
          placeholder="Nome do dashboard"
          className="rounded-md border border-dashed border-border bg-transparent px-2 py-1 text-sm outline-none focus-visible:border-ring"
        />
      ) : (
        <Button type="button" variant="ghost" size="sm" onClick={() => setAddingDashboard(true)}>
          <Plus />
          Dashboard
        </Button>
      )}
    </div>
  );
}
