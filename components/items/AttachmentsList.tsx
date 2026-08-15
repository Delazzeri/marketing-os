"use client";

import { useActionState, useTransition } from "react";
import {
  createItemAttachment,
  deleteItemAttachment,
  type ItemAttachmentFormState,
} from "@/lib/actions/item-attachments";
import type { WorkspaceMember } from "@/lib/types";
import { SectionHeader } from "@/components/items/SectionHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Paperclip, X } from "lucide-react";

interface AttachmentRow {
  id: number;
  file_url: string;
  file_name: string;
  uploaded_by: string | null;
}

const initialState: ItemAttachmentFormState = {};

export function AttachmentsList({
  itemId,
  attachments,
  members,
}: {
  itemId: number;
  attachments: AttachmentRow[];
  members: WorkspaceMember[];
}) {
  const [state, formAction, pending] = useActionState(
    createItemAttachment.bind(null, itemId),
    initialState,
  );
  const [, startTransition] = useTransition();

  function memberName(userId: string | null) {
    return members.find((m) => m.userId === userId)?.name ?? "Sistema";
  }

  return (
    <div className="flex flex-col gap-2">
      <SectionHeader>Anexos</SectionHeader>

      {attachments.length > 0 && (
        <ul className="flex flex-col gap-1">
          {attachments.map((attachment) => (
            <li key={attachment.id} className="flex items-center justify-between gap-2 text-sm">
              <a
                href={attachment.file_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 truncate hover:underline"
              >
                <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                {attachment.file_name}
              </a>
              <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                {memberName(attachment.uploaded_by)}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => startTransition(() => deleteItemAttachment(attachment.id))}
                  className="text-muted-foreground/50 hover:text-destructive"
                  title="Excluir anexo"
                >
                  <X />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form action={formAction} className="flex items-center gap-2">
        <Input name="fileUrl" placeholder="URL do arquivo" required />
        <Input name="fileName" placeholder="Nome" required className="max-w-[160px]" />
        <Button type="submit" variant="outline" size="icon" disabled={pending}>
          <Paperclip />
        </Button>
      </form>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
    </div>
  );
}
