import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceMembersWithEmail } from "@/lib/supabase/user-lookup";
import { EditableCell } from "@/components/columns/EditableCell";
import { ItemTitle } from "@/components/items/ItemTitle";
import { UpdateComposer } from "@/components/items/UpdateComposer";
import { UpdatesFeed } from "@/components/items/UpdatesFeed";
import { AttachmentsList } from "@/components/items/AttachmentsList";
import { isItemOverdue } from "@/lib/automations/overdue";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { ColumnType } from "@/lib/column-types/schemas";

export async function ItemPanel({
  boardId,
  itemId,
  autoFocusTitle = false,
}: {
  workspaceSlug: string;
  boardId: number;
  itemId: number;
  autoFocusTitle?: boolean;
}) {
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("items")
    .select("id, title, values, board_id, boards(workspace_id)")
    .eq("id", itemId)
    .eq("board_id", boardId)
    .single();

  if (!item) notFound();

  const boardsRelation = item.boards as unknown as { workspace_id: number }[] | { workspace_id: number } | null;
  const workspaceId = Array.isArray(boardsRelation) ? boardsRelation[0]?.workspace_id : boardsRelation?.workspace_id;

  const [{ data: columns }, { data: updates }, { data: attachments }, { data: overdueAutomation }, members] =
    await Promise.all([
      supabase
        .from("columns")
        .select("id, name, type, config")
        .eq("board_id", boardId)
        .order("position", { ascending: true }),
      supabase
        .from("item_updates")
        .select("id, author_id, body, mentioned_user_ids, created_at")
        .eq("item_id", itemId)
        .order("created_at", { ascending: true }),
      supabase
        .from("item_attachments")
        .select("id, file_url, file_name, uploaded_by, created_at")
        .eq("item_id", itemId)
        .order("created_at", { ascending: true }),
      supabase
        .from("automations")
        .select("action_config")
        .eq("board_id", boardId)
        .eq("action_type", "mark_overdue")
        .eq("enabled", true)
        .maybeSingle(),
      workspaceId ? getWorkspaceMembersWithEmail(workspaceId) : Promise.resolve([]),
    ]);

  const itemValues = (item.values ?? {}) as Record<string, unknown>;
  const boardColumns = (columns ?? []).map((column) => ({
    id: column.id,
    name: column.name,
    type: column.type as ColumnType,
    config:
      column.type === "person" || column.type === "people"
        ? { ...(column.config as Record<string, unknown>), members }
        : ((column.config ?? {}) as Record<string, unknown>),
  }));

  const overdueDateColumnId = (overdueAutomation?.action_config as { dateColumnId?: number } | null)
    ?.dateColumnId;
  const overdue = overdueDateColumnId
    ? isItemOverdue({ id: item.id, values: itemValues }, overdueDateColumnId)
    : false;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <ItemTitle itemId={item.id} title={item.title} autoFocus={autoFocusTitle} />
        {overdue && (
          <Badge variant="destructive" className="text-[10px]">
            atrasado
          </Badge>
        )}
      </div>

      {boardColumns.length > 0 && (
        <div className="flex flex-col gap-2">
          {boardColumns.map((column) => (
            <div key={column.id} className="flex items-center gap-3">
              <span className="w-32 shrink-0 text-sm text-muted-foreground">{column.name}</span>
              <EditableCell
                itemId={item.id}
                columnId={column.id}
                columnType={column.type}
                config={column.config}
                value={itemValues[column.id]}
              />
            </div>
          ))}
        </div>
      )}

      <Separator />

      <Tabs defaultValue="updates">
        <TabsList>
          <TabsTrigger value="updates">Atualizações</TabsTrigger>
          <TabsTrigger value="files">Arquivos</TabsTrigger>
          <TabsTrigger value="activity">Atividade</TabsTrigger>
        </TabsList>

        <TabsContent value="updates" className="flex flex-col gap-3 pt-3">
          <UpdatesFeed updates={updates ?? []} members={members} />
          <UpdateComposer itemId={item.id} members={members} />
        </TabsContent>

        <TabsContent value="files" className="pt-3">
          <AttachmentsList itemId={item.id} attachments={attachments ?? []} members={members} />
        </TabsContent>

        <TabsContent value="activity" className="pt-3">
          <p className="text-sm text-muted-foreground">Nenhuma atividade registrada ainda.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
