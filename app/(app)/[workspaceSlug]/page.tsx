import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateBoardForm } from "@/components/boards/CreateBoardForm";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutGrid } from "lucide-react";

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

  const { data: boards } = await supabase
    .from("boards")
    .select("id, name, slug")
    .eq("workspace_id", workspace.id)
    .order("position", { ascending: true });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <h1 className="text-xl font-semibold">{workspace.name}</h1>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(boards ?? []).map((board) => (
          <Link key={board.id} href={`/${workspaceSlug}/boards/${board.id}`}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader className="flex-row items-center gap-3 space-y-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <LayoutGrid className="h-4 w-4" />
                </div>
                <CardTitle>{board.name}</CardTitle>
              </CardHeader>
            </Card>
          </Link>
        ))}
        {(boards ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum board ainda.</p>
        )}
      </div>

      <CreateBoardForm workspaceSlug={workspaceSlug} />
    </div>
  );
}
