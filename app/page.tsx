import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserContext } from "@/lib/auth/roles";

// Admins manage multiple workspaces and land in /admin instead of any
// specific one. Everyone else keeps the old mono-workspace behavior: resolve
// their first/only membership and forward there.
export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { isAdmin } = await getCurrentUserContext();
  if (isAdmin) redirect("/admin");

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
