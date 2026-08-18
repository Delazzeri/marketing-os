"use client";

import { InvitePersonModal } from "@/components/team/InvitePersonModal";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { avatarColorFor } from "@/lib/avatar-color";
import { UserPlus, Plus } from "lucide-react";

interface MemberSummary {
  userId: string;
  name: string;
}

function focusFirstNewItemInput() {
  const input = document.querySelector<HTMLInputElement>('input[name="title"]');
  if (!input) return;
  input.scrollIntoView({ behavior: "smooth", block: "center" });
  input.focus();
}

// "Admin"/"Membro" mirrors the same owner→Admin, member→Membro mapping
// TeamPanel.tsx uses — see lib/actions/workspace-members.ts for why there's
// no third role value yet.
const ROLE_LABELS: Record<"owner" | "member", string> = {
  owner: "Admin",
  member: "Membro",
};

export function BoardHeader({
  workspaceId,
  members,
  currentUserRole,
}: {
  workspaceId: number;
  members: MemberSummary[];
  currentUserRole: "owner" | "member" | null;
}) {
  const visibleMembers = members.slice(0, 4);
  const overflowCount = members.length - visibleMembers.length;

  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-2">
        {visibleMembers.map((member) => (
          <Avatar key={member.userId} size="sm" className="ring-2 ring-background">
            <AvatarFallback
              className="text-[10px] font-medium text-white"
              style={{ backgroundColor: avatarColorFor(member.name) }}
            >
              {member.name.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ))}
        {overflowCount > 0 && (
          <Avatar size="sm" className="ring-2 ring-background">
            <AvatarFallback className="text-[10px] font-medium">+{overflowCount}</AvatarFallback>
          </Avatar>
        )}
      </div>

      {currentUserRole && (
        <span className="hidden text-xs text-muted-foreground sm:inline">
          Você · {ROLE_LABELS[currentUserRole]}
        </span>
      )}

      <InvitePersonModal
        workspaceId={workspaceId}
        trigger={
          <Button type="button" variant="outline" size="sm">
            <UserPlus />
            Convidar
          </Button>
        }
      />

      <Button type="button" size="sm" onClick={focusFirstNewItemInput}>
        <Plus />
        Criar conteúdos
      </Button>
    </div>
  );
}
