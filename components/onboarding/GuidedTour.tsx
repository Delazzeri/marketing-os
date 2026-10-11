"use client";

import { useEffect, useState, useSyncExternalStore, useTransition, type CSSProperties } from "react";
import { usePathname, useRouter } from "next/navigation";
import { endGuidedTour } from "@/lib/actions/auth";
import { GUIDED_TOUR_STEP_KEY, type GuidedTourAnchor } from "@/lib/guided-tour";
import { Button } from "@/components/ui/button";

interface TourStep {
  page: "home" | "board";
  // Element marked with data-tour="<anchor>"; omitted = centered card, no spotlight.
  anchor?: GuidedTourAnchor;
  title: string;
  body: string;
}

const STEPS: TourStep[] = [
  {
    page: "home",
    title: "Bem-vindo(a) ao Marketing OS",
    body: "Um Work OS para organizar o conteúdo de vários canais e clientes num lugar só. Este tour rápido mostra o essencial. Use as setas do teclado ou os botões abaixo.",
  },
  {
    page: "home",
    anchor: "sidebar-boards",
    title: "Quadros",
    body: "Cada canal ou cliente ganha um quadro próprio: Instagram, YouTube, LinkedIn... Tudo fica sempre a um clique aqui na barra lateral.",
  },
  {
    page: "home",
    anchor: "notifications",
    title: "Notificações",
    body: "Quando alguém te menciona com @ ou uma automação te atribui algo, o aviso chega aqui.",
  },
  {
    page: "board",
    anchor: "view-tabs",
    title: "Visualizações",
    body: "O mesmo conteúdo visto de jeitos diferentes: Tabela para editar, Calendário para planejar as datas, Kanban por status e Dashboards com gráficos.",
  },
  {
    page: "board",
    anchor: "group-header",
    title: "Grupos",
    body: "Os itens ficam organizados em grupos, por mês ou campanha. Clique no nome para renomear, na bolinha para mudar a cor, e no ⋯ para mais opções.",
  },
  {
    page: "board",
    anchor: "item-title",
    title: "Itens",
    body: "Cada linha é uma entrega. Clique no título para abrir os detalhes: comentários, @menções e anexos.",
  },
  {
    page: "board",
    anchor: "status-cell",
    title: "Edição direta na tabela",
    body: "Clique em qualquer célula para mudar status, formato, data ou legenda, sem precisar abrir o item.",
  },
  {
    page: "board",
    anchor: "new-item",
    title: "Criar um item",
    body: "Digite um título aqui e pressione Enter. O item novo aparece na hora no grupo.",
  },
  {
    page: "board",
    anchor: "automations",
    title: "Automações",
    body: "Regras prontas que trabalham por você: avisar o responsável quando o status muda, marcar itens atrasados, definir responsável padrão...",
  },
  {
    page: "board",
    anchor: "portal",
    title: "Portal do cliente",
    body: "Gere um link somente-leitura para o cliente acompanhar as entregas do quadro, sem precisar criar conta.",
  },
  {
    page: "board",
    title: "Tudo pronto!",
    body: "Agora é com você: crie itens, mude status, troque de visualização e explore à vontade.",
  },
];

// The current step lives in sessionStorage so a hard reload mid-tour resumes
// where it was, instead of restarting. useSyncExternalStore keeps the server
// render (always nothing) and the first client render consistent.
const STEP_KEY = GUIDED_TOUR_STEP_KEY;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readStep(): number {
  try {
    const value = Number(window.sessionStorage.getItem(STEP_KEY));
    return Number.isInteger(value) && value >= 0 ? value : 0;
  } catch {
    return 0;
  }
}

function writeStep(step: number | null) {
  try {
    if (step === null) window.sessionStorage.removeItem(STEP_KEY);
    else window.sessionStorage.setItem(STEP_KEY, String(step));
  } catch {
    // Storage blocked — the tour still works, it just won't survive a reload.
  }
  listeners.forEach((listener) => listener());
}

// How long to wait for a step's element (e.g. right after navigating to the
// board) before giving up and showing the card centered instead.
const ANCHOR_TIMEOUT_MS = 2500;
const SPOTLIGHT_PADDING = 6;
const CARD_WIDTH = 340;
const CARD_GAP = 12;
const VIEWPORT_MARGIN = 16;
const ESTIMATED_CARD_HEIGHT = 230;

type Measured = { stepIndex: number; rect: DOMRect | null };

export function GuidedTour({ workspaceSlug, boardId }: { workspaceSlug: string; boardId: number | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [finished, setFinished] = useState(false);
  const storedStep = useSyncExternalStore(subscribe, readStep, () => null);
  const [measured, setMeasured] = useState<Measured | null>(null);

  // Without a board to point at, board steps would have nowhere to go.
  const steps = boardId ? STEPS : STEPS.filter((step) => step.page === "home");
  const stepIndex = storedStep === null ? null : Math.min(storedStep, steps.length - 1);
  const step = stepIndex === null ? null : steps[stepIndex];
  const homePath = `/${workspaceSlug}`;
  const stepPath = step?.page === "board" && boardId ? `${homePath}/boards/${boardId}` : homePath;
  const active = !finished && step !== null;

  useEffect(() => {
    if (active && pathname !== stepPath) router.push(stepPath);
  }, [active, pathname, stepPath, router]);

  useEffect(() => {
    if (!active || stepIndex === null || pathname !== stepPath) return;
    const anchor = steps[stepIndex].anchor;
    const startedAt = performance.now();
    let element: Element | null = null;
    let frame = 0;

    function measure() {
      if (!element) return;
      const rect = element.getBoundingClientRect();
      setMeasured({ stepIndex: stepIndex as number, rect: rect.width > 0 && rect.height > 0 ? rect : null });
    }

    function locate() {
      if (!anchor) {
        setMeasured({ stepIndex: stepIndex as number, rect: null });
        return;
      }
      const candidate = document.querySelector(`[data-tour="${anchor}"]`);
      const rect = candidate?.getBoundingClientRect();
      if (candidate && rect && rect.width > 0 && rect.height > 0) {
        element = candidate;
        element.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
        measure();
        return;
      }
      if (performance.now() - startedAt < ANCHOR_TIMEOUT_MS) {
        frame = requestAnimationFrame(locate);
      } else {
        setMeasured({ stepIndex: stepIndex as number, rect: null });
      }
    }

    frame = requestAnimationFrame(locate);
    // Smooth scrolling and late layout shifts move the target after the first
    // measurement, so keep following it while the step is open.
    const interval = window.setInterval(measure, 250);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelAnimationFrame(frame);
      window.clearInterval(interval);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
    // steps only changes with boardId, which is stable for the tour's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, stepIndex, pathname, stepPath]);

  function finish() {
    setFinished(true);
    writeStep(null);
    startTransition(() => endGuidedTour());
  }

  function goTo(next: number) {
    if (next >= steps.length) finish();
    else writeStep(Math.max(0, next));
  }

  useEffect(() => {
    if (!active || stepIndex === null) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") finish();
      else if (event.key === "ArrowRight" || event.key === "Enter") goTo((stepIndex as number) + 1);
      else if (event.key === "ArrowLeft") goTo((stepIndex as number) - 1);
      else return;
      event.preventDefault();
      event.stopPropagation();
    }
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  });

  if (!active || stepIndex === null || step === null) return null;

  // Until the current step's element has been located, keep the screen dimmed
  // but show no card, so it doesn't jump from the center to the target.
  const ready = measured?.stepIndex === stepIndex && pathname === stepPath;
  const rect = ready ? measured.rect : null;
  const isLast = stepIndex === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-labelledby="guided-tour-title">
      {/* Blocks clicks on the page underneath while the tour is open. */}
      <div className="absolute inset-0" />

      {rect ? (
        <div
          className="pointer-events-none absolute rounded-lg ring-2 ring-primary transition-all duration-300 ease-out"
          style={{
            left: rect.left - SPOTLIGHT_PADDING,
            top: rect.top - SPOTLIGHT_PADDING,
            width: rect.width + SPOTLIGHT_PADDING * 2,
            height: rect.height + SPOTLIGHT_PADDING * 2,
            boxShadow: "0 0 0 9999px rgb(0 0 0 / 0.55)",
          }}
        />
      ) : (
        <div className="pointer-events-none absolute inset-0 bg-black/55 transition-colors duration-300" />
      )}

      {ready && (
        <div
          key={stepIndex}
          className="absolute flex flex-col gap-3 rounded-xl bg-popover p-4 text-popover-foreground shadow-2xl ring-1 ring-foreground/10 animate-in fade-in-0 zoom-in-95 duration-200"
          style={cardPosition(rect)}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-muted-foreground">
              Passo {stepIndex + 1} de {steps.length}
            </span>
            <div className="flex gap-1" aria-hidden>
              {steps.map((_, index) => (
                <span
                  key={index}
                  className={`h-1.5 rounded-full transition-all ${
                    index === stepIndex ? "w-4 bg-primary" : index < stepIndex ? "w-1.5 bg-primary/50" : "w-1.5 bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <h2 id="guided-tour-title" className="text-base font-semibold">
              {step.title}
            </h2>
            <p className="text-sm text-muted-foreground">{step.body}</p>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            {isLast ? (
              <span />
            ) : (
              <button
                type="button"
                onClick={finish}
                className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                Pular tour
              </button>
            )}
            <div className="flex gap-2">
              {stepIndex > 0 && (
                <Button type="button" variant="outline" size="sm" onClick={() => goTo(stepIndex - 1)}>
                  Voltar
                </Button>
              )}
              <Button type="button" size="sm" autoFocus onClick={() => goTo(stepIndex + 1)}>
                {stepIndex === 0 ? "Começar" : isLast ? "Concluir" : "Próximo"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Places the card next to the spotlight: beside tall targets (like the
// sidebar), otherwise below if there's room, else above. Clamped so it never
// leaves the viewport; centered when there is no target.
function cardPosition(rect: DOMRect | null): CSSProperties {
  const width = `min(${CARD_WIDTH}px, calc(100vw - ${VIEWPORT_MARGIN * 2}px))`;
  if (!rect) {
    return { width, left: "50%", top: "50%", transform: "translate(-50%, -50%)" };
  }

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const cardWidth = Math.min(CARD_WIDTH, viewportWidth - VIEWPORT_MARGIN * 2);
  const clampLeft = (left: number) =>
    Math.min(Math.max(left, VIEWPORT_MARGIN), viewportWidth - cardWidth - VIEWPORT_MARGIN);

  const spaceRight = viewportWidth - rect.right;
  const spaceBelow = viewportHeight - rect.bottom;
  const isTall = rect.height > viewportHeight * 0.4;

  if (isTall && spaceRight >= cardWidth + CARD_GAP * 2) {
    const top = Math.min(
      Math.max(rect.top, VIEWPORT_MARGIN),
      viewportHeight - ESTIMATED_CARD_HEIGHT - VIEWPORT_MARGIN,
    );
    return { width, left: rect.right + CARD_GAP + SPOTLIGHT_PADDING, top: Math.max(top, VIEWPORT_MARGIN) };
  }

  if (spaceBelow >= ESTIMATED_CARD_HEIGHT + CARD_GAP) {
    return { width, left: clampLeft(rect.left), top: rect.bottom + CARD_GAP + SPOTLIGHT_PADDING };
  }

  return {
    width,
    left: clampLeft(rect.left),
    bottom: Math.max(viewportHeight - rect.top + CARD_GAP + SPOTLIGHT_PADDING, VIEWPORT_MARGIN),
  };
}
