"use client";

import { renameBoard } from "@/lib/actions/boards";
import { InlineEditableText } from "@/components/layout/InlineEditableText";

export function BoardTitle({
  boardId,
  name,
  canEdit,
}: {
  boardId: number;
  name: string;
  canEdit: boolean;
}) {
  return (
    <h1 className="text-2xl font-semibold tracking-tight">
      <InlineEditableText
        value={name}
        onCommit={(next) => renameBoard(boardId, next)}
        readOnly={!canEdit}
        inputClassName="text-2xl font-semibold tracking-tight"
      />
    </h1>
  );
}
