"use client";

import { useActionState, useState } from "react";
import { updateWorkspaceWelcome, type WelcomeFormState } from "@/lib/actions/workspace";
import { BoardSettingsDialog } from "@/components/boards/BoardSettingsDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Plus, X } from "lucide-react";

interface WelcomeLink {
  label: string;
  url: string;
}

const initialState: WelcomeFormState = {};

export function WelcomeEditor({
  workspaceId,
  message,
  links,
}: {
  workspaceId: number;
  message: string;
  links: WelcomeLink[];
}) {
  const boundAction = (prevState: WelcomeFormState, formData: FormData) =>
    updateWorkspaceWelcome(workspaceId, prevState, formData);
  const [state, formAction, pending] = useActionState(boundAction, initialState);
  const [wasPending, setWasPending] = useState(false);
  const [open, setOpen] = useState(false);
  const [draftLinks, setDraftLinks] = useState<WelcomeLink[]>(links.length > 0 ? links : []);

  if (wasPending !== pending) {
    setWasPending(pending);
    if (wasPending && !pending && !state.error && open) setOpen(false);
  }

  function updateLink(index: number, field: keyof WelcomeLink, value: string) {
    setDraftLinks((current) =>
      current.map((link, i) => (i === index ? { ...link, [field]: value } : link)),
    );
  }

  function removeLink(index: number) {
    setDraftLinks((current) => current.filter((_, i) => i !== index));
  }

  return (
    <BoardSettingsDialog
      title="Editar boas-vindas"
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setDraftLinks(links.length > 0 ? links : []);
      }}
      trigger={
        <Button type="button" variant="outline" size="sm">
          <Pencil />
          Editar
        </Button>
      }
    >
      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Mensagem de boas-vindas</label>
          <Textarea name="message" defaultValue={message} rows={5} placeholder="Escreva uma mensagem para a equipe..." />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Links úteis</label>
          <div className="flex flex-col gap-2">
            {draftLinks.map((link, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={link.label}
                  onChange={(event) => updateLink(index, "label", event.target.value)}
                  placeholder="Rótulo"
                  className="w-1/3"
                />
                <Input
                  value={link.url}
                  onChange={(event) => updateLink(index, "url", event.target.value)}
                  placeholder="https://..."
                  className="flex-1"
                />
                <Button type="button" variant="ghost" size="icon-xs" onClick={() => removeLink(index)}>
                  <X />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setDraftLinks((current) => [...current, { label: "", url: "" }])}
            className="self-start"
          >
            <Plus />
            Adicionar link
          </Button>
        </div>

        <input type="hidden" name="links" value={JSON.stringify(draftLinks)} />

        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar"}
        </Button>
        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      </form>
    </BoardSettingsDialog>
  );
}
