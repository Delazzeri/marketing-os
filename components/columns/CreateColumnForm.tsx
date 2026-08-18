"use client";

import { useActionState, useState } from "react";
import { createColumn, type ColumnFormState } from "@/lib/actions/columns";
import { StatusOptionsEditor } from "./StatusOptionsEditor";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import type { ColumnType } from "@/lib/column-types/registry";

const initialState: ColumnFormState = {};

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

export function CreateColumnForm({ boardId }: { boardId: number }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createColumn.bind(null, boardId), initialState);
  const [type, setType] = useState<ColumnType>("text");
  const [wasPending, setWasPending] = useState(false);

  if (wasPending !== pending) {
    setWasPending(pending);
    if (wasPending && !pending && !state.error && open) setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground/60 hover:bg-accent hover:text-foreground"
        aria-label="Adicionar coluna"
      >
        <Plus className="h-4 w-4" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <form action={formAction} className="flex flex-col gap-2">
          <Input name="name" placeholder="Nome da coluna" required autoFocus />
          <input type="hidden" name="type" value={type} />
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

          {OPTION_BASED_TYPES.includes(type) && <StatusOptionsEditor />}

          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Criando..." : "Criar coluna"}
          </Button>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        </form>
      </PopoverContent>
    </Popover>
  );
}
