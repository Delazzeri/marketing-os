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

interface LabeledOption {
  label: string;
  color: string;
}

interface ColumnData {
  id: number;
  name: string;
  type: ColumnType;
  config: Record<string, unknown>;
}

export function ColumnHeaderMenu({ boardId, column }: { boardId: number; column: ColumnData }) {
  const [open, setOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  // Everything below is draft state — nothing here touches the server until
  // "Salvar" is clicked. A previous version committed on every keystroke
  // (rename on blur, type/options via changeColumnType on each edit), which
  // raced overlapping requests with stale closures and once wiped a column's
  // options + every item's stored value for it. Explicit save avoids that.
  const [name, setName] = useState(column.name);
  const [type, setType] = useState<ColumnType>(column.type);
  const initialOptions: LabeledOption[] = OPTION_BASED_TYPES.includes(column.type)
    ? ((column.config.options as LabeledOption[] | undefined) ?? [])
    : [];
  const [options, setOptions] = useState<LabeledOption[]>(initialOptions);

  const typeChanged = type !== column.type;
  const nameChanged = name.trim() !== "" && name.trim() !== column.name;
  const optionsChanged = JSON.stringify(options) !== JSON.stringify(initialOptions);
  const hasChanges = nameChanged || typeChanged || (OPTION_BASED_TYPES.includes(type) && optionsChanged);

  function resetDraft() {
    setName(column.name);
    setType(column.type);
    setOptions(initialOptions);
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetDraft();
    setOpen(next);
  }

  function handleSave() {
    const trimmedName = nameChanged ? name.trim() : undefined;

    startTransition(async () => {
      if (trimmedName) await renameColumn(column.id, trimmedName);
      if (typeChanged || optionsChanged) {
        await changeColumnType(boardId, column.id, type, OPTION_BASED_TYPES.includes(type) ? options : undefined);
      }
    });
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
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
            onKeyDown={(event) => {
              if (event.key === "Enter") handleSave();
            }}
            className="h-8"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Tipo</label>
          <Select value={type} onValueChange={(value) => setType(value as ColumnType)}>
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
          {typeChanged && (
            <p className="text-xs text-muted-foreground">
              Trocar o tipo apaga os valores já preenchidos nesta coluna ao salvar.
            </p>
          )}
        </div>

        {OPTION_BASED_TYPES.includes(type) && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Opções</label>
            <StatusOptionsEditor
              key={typeChanged ? "new" : "current"}
              initial={typeChanged ? [] : initialOptions}
              onCommit={setOptions}
            />
          </div>
        )}

        <Button
          type="button"
          size="sm"
          className="mt-1"
          disabled={!hasChanges || pending}
          onClick={handleSave}
        >
          {pending ? "Salvando..." : "Salvar"}
        </Button>

        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="justify-start"
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
