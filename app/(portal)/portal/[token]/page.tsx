import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { PortalViewSwitcher } from "@/components/portal/PortalViewSwitcher";
import { PortalUpdatesFeed } from "@/components/portal/PortalUpdatesFeed";
import { getWorkspaceMembersWithEmail } from "@/lib/supabase/user-lookup";
import type { ColumnType } from "@/lib/column-types/schemas";

export default async function PortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const service = createServiceClient();

  const { data: portalToken } = await service
    .from("portal_tokens")
    .select("id, board_id, expires_at, revoked_at")
    .eq("token", token)
    .single();

  if (!portalToken) notFound();
  if (portalToken.revoked_at) notFound();
  if (portalToken.expires_at && new Date(portalToken.expires_at) < new Date()) notFound();

  const boardId = portalToken.board_id as number;

  const { data: board } = await service.from("boards").select("id, name, workspace_id").eq("id", boardId).single();
  if (!board) notFound();

  const members = await getWorkspaceMembersWithEmail(board.workspace_id as number);

  const [{ data: groups }, { data: items }, { data: columns }, { data: updates }] = await Promise.all([
    service.from("groups").select("id, name, color").eq("board_id", boardId).order("position", { ascending: true }),
    service
      .from("items")
      .select("id, title, group_id, values")
      .eq("board_id", boardId)
      .order("position", { ascending: true }),
    service.from("columns").select("id, name, type, config").eq("board_id", boardId).order("position", { ascending: true }),
    service
      .from("item_updates")
      .select("id, item_id, body, created_at, items!inner(board_id)")
      .eq("items.board_id", boardId)
      .order("created_at", { ascending: false }),
  ]);

  const boardColumns = (columns ?? []).map((column) => ({
    id: column.id,
    name: column.name,
    type: column.type as ColumnType,
    config:
      column.type === "person" || column.type === "people"
        ? { ...(column.config as Record<string, unknown>), members }
        : ((column.config ?? {}) as Record<string, unknown>),
  }));

  const boardItems = (items ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    groupId: item.group_id as number,
    values: (item.values ?? {}) as Record<string, unknown>,
  }));

  const dateColumn = boardColumns.find((column) => column.type === "date");

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{board.name}</h1>
        <span className="text-sm text-muted-foreground">Portal do cliente · somente leitura</span>
      </div>

      <PortalViewSwitcher groups={groups ?? []} columns={boardColumns} items={boardItems} dateColumn={dateColumn} />

      <PortalUpdatesFeed items={boardItems} updates={updates ?? []} />
    </div>
  );
}
