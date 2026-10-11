"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, ExternalLink, X } from "lucide-react";

interface Step {
  id: string;
  title: string;
  description: string;
  href?: string;
  external?: boolean;
}

interface Progress {
  done: string[];
  dismissed: boolean;
}

const EMPTY_PROGRESS: Progress = { done: [], dismissed: false };

// Progress is a per-viewer convenience, so it lives in localStorage keyed by
// user — nothing else in the app depends on it. useSyncExternalStore (instead
// of reading storage in useState's initializer) keeps the server render and
// first client render identical, then swaps in the stored value.
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function parseProgress(raw: string | null): Progress {
  if (!raw) return EMPTY_PROGRESS;
  try {
    const parsed = JSON.parse(raw) as Partial<Progress>;
    return { done: Array.isArray(parsed.done) ? parsed.done : [], dismissed: Boolean(parsed.dismissed) };
  } catch {
    return EMPTY_PROGRESS;
  }
}

function writeProgress(key: string, progress: Progress) {
  try {
    window.localStorage.setItem(key, JSON.stringify(progress));
  } catch {
    // Storage blocked (private mode etc.) — the checklist just won't persist.
  }
  listeners.forEach((listener) => listener());
}

export function GettingStarted({
  userId,
  workspaceSlug,
  boardId,
  boardName,
  portalUrl,
}: {
  userId: string;
  workspaceSlug: string;
  boardId: number | null;
  boardName: string | null;
  portalUrl: string | null;
}) {
  const storageKey = `getting-started:${userId}`;
  const raw = useSyncExternalStore(
    subscribe,
    () => readRaw(storageKey),
    () => undefined,
  );

  // undefined = server render / before hydration: render nothing rather than
  // flashing the checklist for someone who already dismissed it.
  if (raw === undefined) return null;
  const progress = parseProgress(raw);
  if (progress.dismissed) return null;

  const boardHref = boardId ? `/${workspaceSlug}/boards/${boardId}` : undefined;
  const steps: Step[] = [
    {
      id: "open-board",
      title: `Abra o quadro ${boardName ?? "de um canal"}`,
      description: "Cada quadro organiza as entregas de um canal ou cliente, divididas em grupos.",
      href: boardHref,
    },
    {
      id: "create-item",
      title: "Crie um item",
      description: "Na aba Tabela, digite um título no campo \"Novo item\" de um grupo e pressione Enter.",
      href: boardHref,
    },
    {
      id: "edit-status",
      title: "Mude o status e a data",
      description: "Clique nas células Status e Data Postagem de um item para editar direto na tabela.",
      href: boardHref,
    },
    {
      id: "comment",
      title: "Abra um item e comente",
      description: "Clique no título de um item para abrir o painel de detalhes e deixe uma atualização.",
      href: boardHref,
    },
    {
      id: "calendar",
      title: "Veja tudo no Calendário",
      description: "Troque para a aba Calendário. Dê um duplo clique num dia para criar um post naquela data.",
      href: boardHref,
    },
    {
      id: "views",
      title: "Explore Kanban e Dashboards",
      description: "As mesmas informações agrupadas por status e resumidas em gráficos.",
      href: boardHref,
    },
    ...(portalUrl
      ? [
          {
            id: "portal",
            title: "Veja o Portal do Cliente",
            description: "O link que o cliente recebe: acompanha as entregas sem precisar de login.",
            href: portalUrl,
            external: true,
          },
        ]
      : []),
  ];

  const doneCount = steps.filter((step) => progress.done.includes(step.id)).length;

  function toggle(stepId: string, checked: boolean) {
    const done = checked
      ? Array.from(new Set([...progress.done, stepId]))
      : progress.done.filter((id) => id !== stepId);
    writeProgress(storageKey, { ...progress, done });
  }

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-medium">Primeiros passos</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Um tour rápido pelo app. {doneCount} de {steps.length} concluídos.
          </p>
        </div>
        <button
          type="button"
          onClick={() => writeProgress(storageKey, { ...progress, dismissed: true })}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Fechar guia"
          title="Fechar guia"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>

      <ol className="flex flex-col divide-y divide-border">
        {steps.map((step, index) => {
          const done = progress.done.includes(step.id);
          return (
            <li key={step.id} className="flex items-start gap-3 py-2.5">
              <Checkbox
                checked={done}
                onCheckedChange={(checked) => toggle(step.id, checked)}
                aria-label={`Marcar "${step.title}" como concluído`}
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <p className={done ? "text-sm text-muted-foreground line-through" : "text-sm font-medium"}>
                  {index + 1}. {step.title}
                </p>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
              {step.href &&
                (step.external ? (
                  <a
                    href={step.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => toggle(step.id, true)}
                    className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    Abrir
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <Link
                    href={step.href}
                    onClick={() => step.id === "open-board" && toggle(step.id, true)}
                    className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    Ir
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                ))}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
