"use client";

import { useActionState, useState, type ReactElement } from "react";
import { inviteMember, type InviteMemberFormState } from "@/lib/actions/workspace-members";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

const initialState: InviteMemberFormState = {};

const defaultTrigger = (
  <Button type="button" variant="outline" size="sm">
    <UserPlus />
    Convidar pessoa
  </Button>
);

export function InvitePersonModal({
  workspaceId,
  trigger = defaultTrigger,
}: {
  workspaceId: number;
  trigger?: ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<WorkspaceRole>("member");
  const [state, formAction, pending] = useActionState(inviteMember.bind(null, workspaceId), initialState);
  const [wasPending, setWasPending] = useState(false);

  // Close on successful submit (pending just transitioned to false with no
  // error) — a render-time transition check via useState, same pattern as
  // AppSidebar.tsx's prop sync (this repo's lint rules forbid both
  // setState-in-effect and reading/writing refs during render).
  if (wasPending !== pending) {
    setWasPending(pending);
    if (wasPending && !pending && !state.error && open) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Convidar pessoa</DialogTitle>
        </DialogHeader>
        <form
          action={async (formData) => {
            await formAction(formData);
          }}
          className="flex flex-col gap-3"
        >
          <p className="text-xs text-muted-foreground">A pessoa precisa já ter uma conta criada pelo admin.</p>
          <Input name="email" type="email" placeholder="email@exemplo.com" required />

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

          <Button type="submit" disabled={pending}>
            {pending ? "Convidando..." : "Convidar"}
          </Button>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        </form>
      </DialogContent>
    </Dialog>
  );
}
