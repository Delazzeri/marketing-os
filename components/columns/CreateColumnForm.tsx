"use client";

import { useActionState, useState } from "react";
import { createColumn, type ColumnFormState } from "@/lib/actions/columns";
import { StatusOptionsEditor } from "./StatusOptionsEditor";
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

  if (!open) {
    return (
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Plus />
        Adicionar coluna
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input name="name" placeholder="Nome da coluna" required autoFocus className="max-w-xs" />
        <input type="hidden" name="type" value={type} />
        <Select value={type} onValueChange={(value) => setType(value as ColumnType)}>
          <SelectTrigger>
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
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Criando..." : "Criar"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>

      {OPTION_BASED_TYPES.includes(type) && <StatusOptionsEditor />}

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
