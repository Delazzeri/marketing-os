"use client";

import { useTransition } from "react";
import { removeMember } from "@/lib/actions/workspace-members";
import { InvitePersonModal } from "@/components/team/InvitePersonModal";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { avatarColorFor } from "@/lib/avatar-color";
import { ROLE_LABELS, type WorkspaceRole } from "@/lib/roles";
import { X } from "lucide-react";

interface MemberRow {
  membershipId: number;
  userId: string;
  name: string;
  role: WorkspaceRole;
}

export function TeamPanel({
  workspaceId,
  members,
  canManageTeam = false,
}: {
  workspaceId: number;
  members: MemberRow[];
  canManageTeam?: boolean;
}) {
  const [, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground">Equipe</h2>
        {canManageTeam && <InvitePersonModal workspaceId={workspaceId} />}
      </div>

      <ul className="flex flex-col gap-1">
        {members.map((member) => (
          <li
            key={member.membershipId}
            className="group/member flex items-center gap-2.5 rounded-lg border border-border px-3 py-2"
          >
            <Avatar size="sm">
              <AvatarFallback
                className="text-[10px] font-medium text-white"
                style={{ backgroundColor: avatarColorFor(member.name) }}
              >
                {member.name.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="flex-1 text-sm">{member.name}</span>
            <Badge variant={member.role === "owner" || member.role === "coordinator" ? "default" : "secondary"}>
              {ROLE_LABELS[member.role]}
            </Badge>
            {canManageTeam && member.role !== "owner" && (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => startTransition(() => removeMember(member.membershipId))}
                className="text-muted-foreground/50 opacity-0 hover:text-destructive group-hover/member:opacity-100"
                title="Remover da equipe"
              >
                <X />
              </Button>
            )}
          </li>
        ))}
        {members.length === 0 && <p className="text-sm text-muted-foreground">Nenhum membro ainda.</p>}
      </ul>
    </div>
  );
}
