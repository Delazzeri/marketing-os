"use client";

import { useState, useTransition } from "react";
import { renameColumn, deleteColumn, changeColumnType } from "@/lib/actions/columns";
import { StatusOptionsEditor } from "./StatusOptionsEditor";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoreVertical, Trash2 } from "lucide-react";
import type { ColumnType } from "@/lib/column-types/registry";

const COLUMN_TYPE_LABELS: Record<ColumnType, string> = {
  text: "Texto",
  status: "Status",
  date: "Data",
  link: "Link",
  person: "Pessoa",
  format: "Formato",
  people: "Pessoas",
  number: "Número",
  select: "Lista suspensa",
  check: "Caixa de seleção",
  whatsapp: "WhatsApp",
};

const OPTION_BASED_TYPES: ColumnType[] = ["status", "format", "select"];

interface ColumnData {
  id: number;
  name: string;
  type: ColumnType;
  config: Record<string, unknown>;
}

export function ColumnHeaderMenu({ boardId, column }: { boardId: number; column: ColumnData }) {
  const [open, setOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [, startTransition] = useTransition();
  const [name, setName] = useState(column.name);
  const [type, setType] = useState<ColumnType>(column.type);
  const initialOptions = OPTION_BASED_TYPES.includes(column.type)
    ? ((column.config.options as { label: string; color: string }[] | undefined) ?? [])
    : [];

  function commitName() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === column.name) {
      setName(column.name);
      return;
    }
    startTransition(() => renameColumn(column.id, trimmed));
  }

  function commitType(nextType: ColumnType, options?: { label: string; color: string }[]) {
    setType(nextType);
    startTransition(() => changeColumnType(boardId, column.id, nextType, options));
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="ml-auto shrink-0 rounded p-0.5 text-muted-foreground/50 opacity-0 hover:bg-accent hover:text-foreground group-hover:opacity-100 data-popup-open:opacity-100"
        aria-label="Opções da coluna"
      >
        <MoreVertical className="h-3.5 w-3.5" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Nome</label>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            onBlur={commitName}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
            className="h-8"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Tipo</label>
          <Select
            value={type}
            onValueChange={(value) => {
              const nextType = value as ColumnType;
              if (!OPTION_BASED_TYPES.includes(nextType)) commitType(nextType);
              else setType(nextType);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue>{COLUMN_TYPE_LABELS[type]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(COLUMN_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {type !== column.type && (
            <p className="text-xs text-muted-foreground">
              Trocar o tipo apaga os valores já preenchidos nesta coluna.
            </p>
          )}
        </div>

        {OPTION_BASED_TYPES.includes(type) && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Opções</label>
            <StatusOptionsEditor
              key={type === column.type ? "current" : "new"}
              initial={type === column.type ? initialOptions : []}
              onCommit={(options) => commitType(type, options)}
            />
          </div>
        )}

        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="mt-1 justify-start"
          onClick={() => {
            setOpen(false);
            setConfirmingDelete(true);
          }}
        >
          <Trash2 />
          Apagar coluna
        </Button>
      </PopoverContent>

      <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar coluna &ldquo;{column.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              Os valores preenchidos nesta coluna serão apagados para todos os itens. Essa ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => startTransition(() => deleteColumn(column.id))}
            >
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Popover>
  );
}
