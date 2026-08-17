"use client";

import { useState } from "react";
import { whatsappValueSchema, type WhatsappValue } from "./schemas";
import type { ColumnTypeDefinition, EditorProps, TableCellProps } from "./types";
import { Input } from "@/components/ui/input";
import { MessageCircle } from "lucide-react";

export { whatsappValueSchema, type WhatsappValue } from "./schemas";

function buildWaLink(value: WhatsappValue): string {
  const digits = (value.phone ?? "").replace(/\D/g, "");
  const text = value.message ? `?text=${encodeURIComponent(value.message)}` : "";
  return digits ? `https://wa.me/${digits}${text}` : "";
}

// Same split as link.tsx: the pill click opens the editor (so a set value
// stays editable), the send icon is the only part that opens wa.me.
function WhatsappTableCell({ value }: TableCellProps<WhatsappValue>) {
  if (!value || !value.phone) return null;
  const href = buildWaLink(value);

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366]/15 px-2.5 py-0.5 text-xs font-medium text-[#1fae53] dark:text-[#3fe087]">
      {value.groupName || "Enviar"}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(event) => event.stopPropagation()}
        className="shrink-0 hover:opacity-70"
        aria-label="Enviar no WhatsApp"
      >
        <MessageCircle className="h-3.5 w-3.5" />
      </a>
    </span>
  );
}

function WhatsappEditor({ value, onCommit, onCancel }: EditorProps<WhatsappValue>) {
  const [groupName, setGroupName] = useState(value?.groupName ?? "");
  const [phone, setPhone] = useState(value?.phone ?? "");
  const [message, setMessage] = useState(value?.message ?? "");

  function commit() {
    const parsed = whatsappValueSchema.safeParse({
      groupName: groupName || undefined,
      phone: phone || undefined,
      message: message || undefined,
    });
    if (!parsed.success) {
      onCancel();
      return;
    }
    onCommit(parsed.data);
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-popover p-2 shadow-md">
      <Input
        autoFocus
        placeholder="Nome do grupo"
        value={groupName}
        onChange={(event) => setGroupName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") onCancel();
        }}
        className="h-7"
      />
      <Input
        placeholder="Telefone (com DDI/DDD)"
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") onCancel();
        }}
        className="h-7"
      />
      <Input
        placeholder="Mensagem (opcional)"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") commit();
          if (event.key === "Escape") onCancel();
        }}
        onBlur={commit}
        className="h-7"
      />
    </div>
  );
}

export const whatsappColumnType: ColumnTypeDefinition<WhatsappValue> = {
  validate: whatsappValueSchema,
  renderTableCell: WhatsappTableCell,
  renderEditor: WhatsappEditor,
};
