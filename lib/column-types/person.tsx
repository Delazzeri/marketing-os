"use client";

import { personValueSchema, type PersonValue } from "./schemas";
import type {
  ColumnConfig,
  ColumnTypeDefinition,
  EditorProps,
  TableCellProps,
} from "./types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { avatarColorFor } from "@/lib/avatar-color";

export { personValueSchema, type PersonValue } from "./schemas";

export interface WorkspaceMemberSummary {
  userId: string;
  name: string;
  avatarUrl: string | null;
}

export interface PersonColumnConfig extends ColumnConfig {
  members?: WorkspaceMemberSummary[];
}

function findMember(config: ColumnConfig, userId: string | undefined): WorkspaceMemberSummary | null {
  if (!userId) return null;
  const members = (config as PersonColumnConfig).members ?? [];
  return members.find((member) => member.userId === userId) ?? null;
}

function PersonTableCell({ value, config }: TableCellProps<PersonValue>) {
  const member = findMember(config, value?.userId);
  if (!member) return null;

  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <Avatar size="sm">
        <AvatarFallback
          className="text-[10px] font-medium text-white"
          style={{ backgroundColor: avatarColorFor(member.name) }}
        >
          {member.name.slice(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      {member.name}
    </span>
  );
}

function PersonEditor({ value, config, onCommit, onCancel }: EditorProps<PersonValue>) {
  const members = (config as PersonColumnConfig).members ?? [];

  return (
    <select
      autoFocus
      defaultValue={value?.userId ?? ""}
      onChange={(event) =>
        onCommit(event.target.value ? { userId: event.target.value } : null)
      }
      onBlur={onCancel}
      onKeyDown={(event) => {
        if (event.key === "Escape") onCancel();
      }}
      className="w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
    >
      <option value="">—</option>
      {members.map((member) => (
        <option key={member.userId} value={member.userId}>
          {member.name}
        </option>
      ))}
    </select>
  );
}

export const personColumnType: ColumnTypeDefinition<PersonValue> = {
  validate: personValueSchema,
  renderTableCell: PersonTableCell,
  renderEditor: PersonEditor,
};
