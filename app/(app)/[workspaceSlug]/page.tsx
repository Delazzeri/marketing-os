import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateBoardForm } from "@/components/boards/CreateBoardForm";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const supabase = await createClient();

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name")
    .eq("slug", workspaceSlug)
    .single();

  if (!workspace) notFound();

  const { data: firstBoard } = await supabase
    .from("boards")
    .select("id")
    .eq("workspace_id", workspace.id)
    .order("position", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (firstBoard) redirect(`/${workspaceSlug}/boards/${firstBoard.id}`);

  // No boards yet — only reachable state here is "create the first one".
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <h1 className="text-xl font-semibold">{workspace.name}</h1>
      <p className="text-sm text-muted-foreground">Nenhum quadro ainda. Crie o primeiro:</p>
      <CreateBoardForm workspaceSlug={workspaceSlug} />
    </div>
  );
}
