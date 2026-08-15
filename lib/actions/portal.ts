"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { portalTokenFieldsSchema } from "@/lib/validation/portal";

export type PortalTokenFormState = { error?: string };

// portal_tokens has zero RLS policies for anon/authenticated — every read
// or write must go through the service client. Authorization (is the
// caller actually a member of this board?) is checked here first, with
// the normal RLS-bound client, before any service-role call is made.
async function assertBoardMember(boardId: number) {
  const supabase = await createClient();
  const { data: board } = await supabase.from("boards").select("id").eq("id", boardId).single();
  if (!board) throw new Error("Board não encontrado.");
}

export async function createPortalToken(
  boardId: number,
  _prevState: PortalTokenFormState,
  formData: FormData,
): Promise<PortalTokenFormState> {
  let fields;
  try {
    fields = portalTokenFieldsSchema.parse({ expiresAt: formData.get("expiresAt") });
  } catch {
    return { error: "Data de expiração inválida." };
  }

  try {
    await assertBoardMember(boardId);
  } catch {
    return { error: "Board não encontrado." };
  }

  const service = createServiceClient();
  const { error: insertError } = await service.from("portal_tokens").insert({
    board_id: boardId,
    token: randomUUID(),
    expires_at: fields.expiresAt ?? null,
  });

  if (insertError) return { error: insertError.message };

  revalidatePath("/[workspaceSlug]/boards/[boardId]", "page");
  return {};
}

export async function revokePortalToken(tokenId: number, boardId: number) {
  await assertBoardMember(boardId);

  const service = createServiceClient();
  const { error } = await service
    .from("portal_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", tokenId);

  if (error) throw new Error(error.message);

  revalidatePath("/[workspaceSlug]/boards/[boardId]", "page");
}

export async function getPortalTokens(boardId: number) {
  await assertBoardMember(boardId);

  const service = createServiceClient();
  const { data } = await service
    .from("portal_tokens")
    .select("id, token, expires_at, revoked_at, created_at")
    .eq("board_id", boardId)
    .order("created_at", { ascending: false });

  return data ?? [];
}
