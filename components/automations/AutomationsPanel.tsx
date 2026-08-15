import { createClient } from "@/lib/supabase/server";
import { getWorkspaceMembersWithEmail } from "@/lib/supabase/user-lookup";
import { AutomationCard } from "@/components/automations/AutomationCard";
import type { AutomationActionType, WorkspaceMember } from "@/lib/types";
import type { ColumnType } from "@/lib/column-types/schemas";

interface ColumnData {
  id: number;
  name: string;
  type: ColumnType;
  config: Record<string, unknown>;
}

interface GroupData {
  id: number;
  name: string;
}

export async function AutomationsPanel({
  boardId,
  workspaceId,
  columns,
  groups,
}: {
  boardId: number;
  workspaceId: number;
  columns: ColumnData[];
  groups: GroupData[];
}) {
  const supabase = await createClient();

  const [{ data: automations }, members] = await Promise.all([
    supabase
      .from("automations")
      .select("id, action_type, action_config, enabled")
      .eq("board_id", boardId),
    getWorkspaceMembersWithEmail(workspaceId) as Promise<WorkspaceMember[]>,
  ]);

  const statusColumns = columns.filter((c) => c.type === "status");
  const dateColumns = columns.filter((c) => c.type === "date");
  const personColumns = columns.filter((c) => c.type === "person");

  function findAutomation(actionType: AutomationActionType) {
    return (automations ?? []).find((a) => a.action_type === actionType) ?? null;
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
      <h2 className="text-sm font-semibold text-muted-foreground">Automações</h2>
      <div className="flex flex-col gap-3">
        <AutomationCard
          boardId={boardId}
          actionType="notify_assignee"
          title="Quando o status mudar, notificar responsável"
          automation={findAutomation("notify_assignee")}
          statusColumns={statusColumns}
          personColumns={personColumns}
        />
        <AutomationCard
          boardId={boardId}
          actionType="mark_overdue"
          title="Quando o prazo vencer, marcar como atrasado"
          automation={findAutomation("mark_overdue")}
          dateColumns={dateColumns}
        />
        <AutomationCard
          boardId={boardId}
          actionType="show_in_portal_update"
          title='Quando o status ficar em um valor específico, gerar atualização no Portal'
          automation={findAutomation("show_in_portal_update")}
          statusColumns={statusColumns}
        />
        <AutomationCard
          boardId={boardId}
          actionType="set_default_assignee"
          title="Quando um item for criado num grupo, definir responsável padrão"
          automation={findAutomation("set_default_assignee")}
          groups={groups}
          personColumns={personColumns}
          members={members}
        />
      </div>
    </div>
  );
}
