import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateBoardForm } from "@/components/boards/CreateBoardForm";
import { WelcomeEditor } from "@/components/workspace/WelcomeEditor";
import { GettingStarted } from "@/components/workspace/GettingStarted";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentUserContext } from "@/lib/auth/roles";
import { canManageTeam } from "@/lib/roles";
import { avatarColorFor } from "@/lib/avatar-color";
import type { BoardType } from "@/lib/validation/boards";
import { ExternalLink, SquarePen } from "lucide-react";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const supabase = await createClient();

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name, welcome_message, welcome_links")
    .eq("slug", workspaceSlug)
    .single();

  if (!workspace) notFound();

  const { data: boards } = await supabase
    .from("boards")
    .select("id, name, icon, type")
    .eq("workspace_id", workspace.id)
    .order("position", { ascending: true });

  const { userId, isAdmin, workspaceRole } = await getCurrentUserContext(workspace.id);
  const canEditWelcome = canManageTeam(workspaceRole, isAdmin);

  // The guide points at one real board, preferring one that already has a
  // permanent (non-expiring, non-revoked) Portal link so the last step has
  // somewhere to go. portal_tokens is
  // service-role only; scoping by the board ids the caller could already read
  // through RLS above keeps this from leaking other workspaces' tokens.
  const standardBoards = (boards ?? []).filter((board) => (board.type as BoardType) !== "whiteboard");
  let portalToken: { board_id: number; token: string } | null = null;
  if (standardBoards.length > 0) {
    const { data } = await createServiceClient()
      .from("portal_tokens")
      .select("board_id, token")
      .in(
        "board_id",
        standardBoards.map((board) => board.id),
      )
      .is("revoked_at", null)
      .is("expires_at", null)
      .order("created_at", { ascending: true })
      .limit(1);
    portalToken = data?.[0] ?? null;
  }
  const guideBoard =
    standardBoards.find((board) => board.id === portalToken?.board_id) ?? standardBoards[0] ?? null;

  const links = (workspace.welcome_links ?? []) as { label: string; url: string }[];
  const message = (workspace.welcome_message as string | null) ?? "";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Bem-vindo(a) à {workspace.name}</h1>
          {message ? (
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{message}</p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              {canEditWelcome ? "Adicione uma mensagem de boas-vindas para a equipe." : "Nenhuma mensagem por aqui ainda."}
            </p>
          )}
        </div>
        {canEditWelcome && <WelcomeEditor workspaceId={workspace.id} message={message} links={links} />}
      </div>

      {userId && (
        <GettingStarted
          userId={userId}
          workspaceSlug={workspaceSlug}
          boardId={guideBoard?.id ?? null}
          boardName={guideBoard?.name ?? null}
          portalUrl={portalToken ? `/portal/${portalToken.token}` : null}
        />
      )}

      {links.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">Links úteis</h2>
          <div className="flex flex-wrap gap-2">
            {links.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm hover:bg-muted"
              >
                {link.label}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">Quadros</h2>
        {boards && boards.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {boards.map((board) => {
              const icon = board.icon as string | null;
              const isImageIcon = icon?.startsWith("http");
              const isWhiteboard = (board.type as BoardType) === "whiteboard";
              return (
                <Link
                  key={board.id}
                  href={`/${workspaceSlug}/boards/${board.id}`}
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm hover:bg-muted"
                >
                  <span
                    className={
                      isWhiteboard
                        ? "flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted"
                        : "flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md text-xs font-semibold text-white"
                    }
                    style={isWhiteboard || isImageIcon ? undefined : { backgroundColor: avatarColorFor(board.name) }}
                  >
                    {isWhiteboard ? (
                      <SquarePen className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : isImageIcon ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={icon as string} alt="" className="h-full w-full object-cover" />
                    ) : (
                      (icon ?? board.name.slice(0, 1).toUpperCase())
                    )}
                  </span>
                  <span className="truncate">{board.name}</span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border p-4">
            <p className="text-sm text-muted-foreground">Nenhum quadro ainda. Crie o primeiro:</p>
            <CreateBoardForm workspaceSlug={workspaceSlug} />
          </div>
        )}
      </div>
    </div>
  );
}
