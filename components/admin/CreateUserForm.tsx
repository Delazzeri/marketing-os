"use client";

import { useActionState, useState } from "react";
import { createUserAccount, type AdminFormState } from "@/lib/actions/admin";
import { BoardSettingsDialog } from "@/components/boards/BoardSettingsDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_LABELS, ASSIGNABLE_ROLES, type WorkspaceRole } from "@/lib/roles";
import { UserPlus } from "lucide-react";

const initialState: AdminFormState = {};

export function CreateUserForm({ workspaces }: { workspaces: { id: number; name: string }[] }) {
  const [state, formAction, pending] = useActionState(createUserAccount, initialState);
  const [wasPending, setWasPending] = useState(false);
  const [open, setOpen] = useState(false);
  const [workspaceId, setWorkspaceId] = useState(workspaces[0] ? String(workspaces[0].id) : "");
  const [role, setRole] = useState<WorkspaceRole>("member");

  if (wasPending !== pending) {
    setWasPending(pending);
    if (wasPending && !pending && !state.error && open) setOpen(false);
  }

  return (
    <BoardSettingsDialog
      title="Nova pessoa"
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button type="button" variant="outline">
          <UserPlus />
          Nova pessoa
        </Button>
      }
    >
      <form action={formAction} className="flex flex-col gap-3">
        <Input name="name" placeholder="Nome" required autoFocus />
        <Input name="email" type="email" placeholder="email@exemplo.com" required />
        <Input name="password" type="password" placeholder="Senha" required minLength={6} />

        <input type="hidden" name="workspaceId" value={workspaceId} />
        <Select value={workspaceId} onValueChange={(value) => setWorkspaceId(value ?? "")}>
          <SelectTrigger className="w-full">
            <SelectValue>{workspaces.find((w) => String(w.id) === workspaceId)?.name ?? "Empresa"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {workspaces.map((workspace) => (
              <SelectItem key={workspace.id} value={String(workspace.id)}>
                {workspace.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <input type="hidden" name="role" value={role} />
        <Select value={role} onValueChange={(value) => setRole(value as WorkspaceRole)}>
          <SelectTrigger className="w-full">
            <SelectValue>{ROLE_LABELS[role]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {ASSIGNABLE_ROLES.map((assignableRole) => (
              <SelectItem key={assignableRole} value={assignableRole}>
                {ROLE_LABELS[assignableRole]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button type="submit" disabled={pending || !workspaceId}>
          {pending ? "Criando..." : "Criar pessoa"}
        </Button>
        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      </form>
    </BoardSettingsDialog>
  );
}
