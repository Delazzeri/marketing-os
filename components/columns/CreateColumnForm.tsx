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
};

export function CreateColumnForm({ boardId }: { boardId: number }) {
  const [state, formAction, pending] = useActionState(createColumn.bind(null, boardId), initialState);
  const [type, setType] = useState<ColumnType>("text");

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-lg border border-dashed border-border p-3">
      <div className="flex items-center gap-2">
        <Input name="name" placeholder="Nome da coluna" required className="max-w-xs" />
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
        <Button type="submit" variant="outline" disabled={pending}>
          <Plus />
          {pending ? "..." : "Coluna"}
        </Button>
      </div>

      {type === "status" && <StatusOptionsEditor />}

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
