"use client";

import { useActionState, useState } from "react";
import { inviteMember, type InviteMemberFormState } from "@/lib/actions/workspace-members";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

const initialState: InviteMemberFormState = {};

export function InvitePersonModal({ workspaceId }: { workspaceId: number }) {
  const [open, setOpen] = useState(false);
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
      <DialogTrigger
        render={
          <Button type="button" variant="outline" size="sm">
            <UserPlus />
            Convidar pessoa
          </Button>
        }
      />
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
          <p className="text-xs text-muted-foreground">
            A pessoa precisa já ter uma conta. O convite adiciona ela ao workspace como Membro.
          </p>
          <Input name="email" type="email" placeholder="email@exemplo.com" required />
          <Button type="submit" disabled={pending}>
            {pending ? "Convidando..." : "Convidar"}
          </Button>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        </form>
      </DialogContent>
    </Dialog>
  );
}
