"use client";

import { peopleValueSchema, type PeopleValue } from "./schemas";
import type {
  ColumnConfig,
  ColumnTypeDefinition,
  EditorProps,
  TableCellProps,
} from "./types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { avatarColorFor } from "@/lib/avatar-color";
import type { WorkspaceMemberSummary } from "./person";

export { peopleValueSchema, type PeopleValue } from "./schemas";

export interface PeopleColumnConfig extends ColumnConfig {
  members?: WorkspaceMemberSummary[];
}

function findMembers(config: ColumnConfig, userIds: string[] | undefined): WorkspaceMemberSummary[] {
  if (!userIds || userIds.length === 0) return [];
  const members = (config as PeopleColumnConfig).members ?? [];
  return userIds
    .map((id) => members.find((member) => member.userId === id))
    .filter((member): member is WorkspaceMemberSummary => Boolean(member));
}

function PeopleTableCell({ value, config }: TableCellProps<PeopleValue>) {
  const members = findMembers(config, value?.userIds);
  if (members.length === 0) return null;

  return (
    <span className="flex items-center -space-x-1.5">
      {members.map((member) => (
        <Avatar key={member.userId} size="sm" className="ring-2 ring-background">
          <AvatarFallback
            className="text-[10px] font-medium text-white"
            style={{ backgroundColor: avatarColorFor(member.name) }}
          >
            {member.name.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ))}
    </span>
  );
}

function PeopleEditor({ value, config, onCommit, onCancel }: EditorProps<PeopleValue>) {
  const members = (config as PeopleColumnConfig).members ?? [];
  const selected = new Set(value?.userIds ?? []);

  function toggle(userId: string) {
    const next = new Set(selected);
    if (next.has(userId)) next.delete(userId);
    else next.add(userId);
    onCommit(next.size > 0 ? { userIds: Array.from(next) } : null);
  }

  return (
    <div
      autoFocus
      tabIndex={-1}
      onBlur={onCancel}
      onKeyDown={(event) => {
        if (event.key === "Escape") onCancel();
      }}
      className="flex max-h-48 flex-col gap-0.5 overflow-auto rounded-lg border border-border bg-popover p-1.5 shadow-md"
    >
      {members.map((member) => (
        <button
          key={member.userId}
          type="button"
          onClick={() => toggle(member.userId)}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-left text-sm hover:bg-accent"
        >
          <input type="checkbox" readOnly checked={selected.has(member.userId)} className="pointer-events-none" />
          {member.name}
        </button>
      ))}
      {members.length === 0 && <p className="px-2 py-1 text-xs text-muted-foreground">Nenhum membro.</p>}
    </div>
  );
}

export const peopleColumnType: ColumnTypeDefinition<PeopleValue> = {
  validate: peopleValueSchema,
  renderTableCell: PeopleTableCell,
  renderEditor: PeopleEditor,
};
