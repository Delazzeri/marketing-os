import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// v1 is mono-workspace (see CLAUDE.md) — a logged-in user has at most one
// workspace membership, so this just resolves it and forwards there instead
// of rendering a placeholder home page.
export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspaces(slug)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  const workspacesRelation = membership?.workspaces as unknown as { slug: string }[] | { slug: string } | null;
  const workspace = Array.isArray(workspacesRelation) ? workspacesRelation[0] : workspacesRelation;

  if (!workspace) redirect("/auth/login");

  redirect(`/${workspace.slug}`);
}
