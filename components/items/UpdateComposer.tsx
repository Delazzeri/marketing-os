"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createItemUpdate, type ItemUpdateFormState } from "@/lib/actions/item-updates";
import type { WorkspaceMember } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const initialState: ItemUpdateFormState = {};

export function UpdateComposer({
  itemId,
  members,
}: {
  itemId: number;
  members: WorkspaceMember[];
}) {
  const [state, formAction, pending] = useActionState(
    createItemUpdate.bind(null, itemId),
    initialState,
  );
  const [body, setBody] = useState("");
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      setBody("");
      setMentionedUserIds([]);
      setMentionQuery(null);
    }
    wasPending.current = pending;
  }, [pending, state.error]);

  function handleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = event.target.value;
    setBody(value);

    const cursor = event.target.selectionStart ?? value.length;
    const beforeCursor = value.slice(0, cursor);
    const match = beforeCursor.match(/@([^\s@]*)$/);
    setMentionQuery(match ? match[1] : null);
  }

  function selectMember(member: WorkspaceMember) {
    const cursor = textareaRef.current?.selectionStart ?? body.length;
    const beforeCursor = body.slice(0, cursor);
    const afterCursor = body.slice(cursor);
    const replaced = beforeCursor.replace(/@([^\s@]*)$/, `@${member.name} `);
    setBody(replaced + afterCursor);
    setMentionedUserIds((prev) => (prev.includes(member.userId) ? prev : [...prev, member.userId]));
    setMentionQuery(null);
    textareaRef.current?.focus();
  }

  const filteredMembers =
    mentionQuery !== null
      ? members.filter((m) => m.name.toLowerCase().includes(mentionQuery.toLowerCase()))
      : [];

  return (
    <form action={formAction} className="flex flex-col gap-1.5">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          name="body"
          value={body}
          onChange={handleChange}
          onKeyDown={(event) => {
            if (event.key === "Escape") setMentionQuery(null);
          }}
          placeholder="Escrever uma atualização... use @ para mencionar"
          required
          rows={3}
        />
        {mentionQuery !== null && filteredMembers.length > 0 && (
          <div className="absolute left-0 top-full z-10 mt-1 w-56 rounded-lg border border-border bg-popover text-popover-foreground shadow-md">
            {filteredMembers.map((member) => (
              <button
                key={member.userId}
                type="button"
                onClick={() => selectMember(member)}
                className="block w-full px-2 py-1.5 text-left text-sm hover:bg-accent"
              >
                {member.name}
              </button>
            ))}
          </div>
        )}
      </div>
      <input type="hidden" name="mentionedUserIds" value={JSON.stringify(mentionedUserIds)} />
      <div className="flex items-center gap-2">
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "..." : "Comentar"}
        </Button>
        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      </div>
    </form>
  );
}
