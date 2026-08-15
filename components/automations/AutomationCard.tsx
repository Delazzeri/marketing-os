"use client";

import { useActionState, useState, useTransition } from "react";
import {
  upsertAutomation,
  toggleAutomation,
  type AutomationFormState,
} from "@/lib/actions/automations";
import type { AutomationActionType, WorkspaceMember } from "@/lib/types";
import type { ColumnType } from "@/lib/column-types/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ColumnOption {
  id: number;
  name: string;
  type: ColumnType;
  config: Record<string, unknown>;
}

interface GroupOption {
  id: number;
  name: string;
}

interface AutomationRow {
  id: number;
  action_config: Record<string, unknown>;
  enabled: boolean;
}

const initialState: AutomationFormState = {};

function FieldSelect({
  name,
  placeholder,
  defaultValue,
  options,
}: {
  name: string;
  placeholder: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
}) {
  const [value, setValue] = useState(defaultValue ?? "");

  return (
    <>
      <input type="hidden" name={name} value={value} required />
      <Select value={value} onValueChange={(next) => setValue(next ?? "")}>
        <SelectTrigger size="sm">
          <SelectValue>{options.find((o) => o.value === value)?.label ?? placeholder}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}

export function AutomationCard({
  boardId,
  actionType,
  title,
  automation,
  statusColumns = [],
  dateColumns = [],
  personColumns = [],
  groups = [],
  members = [],
}: {
  boardId: number;
  actionType: AutomationActionType;
  title: string;
  automation: AutomationRow | null;
  statusColumns?: ColumnOption[];
  dateColumns?: ColumnOption[];
  personColumns?: ColumnOption[];
  groups?: GroupOption[];
  members?: WorkspaceMember[];
}) {
  const [state, formAction, pending] = useActionState(
    upsertAutomation.bind(null, boardId, actionType),
    initialState,
  );
  const [, startTransition] = useTransition();
  const config = automation?.action_config ?? {};

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm">{title}</span>
        {automation && (
          <div className="flex items-center gap-1.5">
            <Switch
              defaultChecked={automation.enabled}
              onCheckedChange={(checked) => startTransition(() => toggleAutomation(automation.id, checked))}
            />
            <span className="text-xs text-muted-foreground">ativo</span>
          </div>
        )}
      </div>

      <form action={formAction} className="flex flex-wrap items-center gap-2">
        {actionType === "notify_assignee" && (
          <>
            <FieldSelect
              name="statusColumnId"
              placeholder="coluna de status"
              defaultValue={config.statusColumnId ? String(config.statusColumnId) : undefined}
              options={statusColumns.map((c) => ({ value: String(c.id), label: c.name }))}
            />
            <FieldSelect
              name="assigneeColumnId"
              placeholder="coluna de responsável"
              defaultValue={config.assigneeColumnId ? String(config.assigneeColumnId) : undefined}
              options={personColumns.map((c) => ({ value: String(c.id), label: c.name }))}
            />
          </>
        )}

        {actionType === "mark_overdue" && (
          <FieldSelect
            name="dateColumnId"
            placeholder="coluna de data"
            defaultValue={config.dateColumnId ? String(config.dateColumnId) : undefined}
            options={dateColumns.map((c) => ({ value: String(c.id), label: c.name }))}
          />
        )}

        {actionType === "show_in_portal_update" && (
          <>
            <FieldSelect
              name="statusColumnId"
              placeholder="coluna de status"
              defaultValue={config.statusColumnId ? String(config.statusColumnId) : undefined}
              options={statusColumns.map((c) => ({ value: String(c.id), label: c.name }))}
            />
            <Input
              name="toValue"
              placeholder="valor (ex: Concluído)"
              defaultValue={(config.toValue as string) ?? ""}
              required
              className="h-7 max-w-[160px]"
            />
          </>
        )}

        {actionType === "set_default_assignee" && (
          <>
            <FieldSelect
              name="groupId"
              placeholder="grupo"
              defaultValue={config.groupId ? String(config.groupId) : undefined}
              options={groups.map((g) => ({ value: String(g.id), label: g.name }))}
            />
            <FieldSelect
              name="assigneeColumnId"
              placeholder="coluna de responsável"
              defaultValue={config.assigneeColumnId ? String(config.assigneeColumnId) : undefined}
              options={personColumns.map((c) => ({ value: String(c.id), label: c.name }))}
            />
            <FieldSelect
              name="defaultUserId"
              placeholder="responsável padrão"
              defaultValue={(config.defaultUserId as string) ?? undefined}
              options={members.map((m) => ({ value: m.userId, label: m.name }))}
            />
          </>
        )}

        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          {pending ? "..." : "Salvar"}
        </Button>
        {state.error && <p className="text-xs text-destructive">{state.error}</p>}
      </form>
    </div>
  );
}
