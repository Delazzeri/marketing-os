"use client";

import { useId, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronRight,
  Folder,
  GripVertical,
  MoreHorizontal,
  Plus,
  Settings,
  Trash2,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { InlineEditableText } from "@/components/layout/InlineEditableText";
import { BoardIconPicker } from "@/components/layout/BoardIconPicker";
import { ColorSwatchPicker } from "@/components/columns/ColorSwatchPicker";
import { COLOR_PALETTE } from "@/lib/column-types/color-palette";
import { DEFAULT_BOARD_ICON } from "@/lib/board-icons";
import {
  quickCreateBoard,
  renameBoard,
  setBoardIcon,
  moveBoardToFolder,
  reorderBoards,
  deleteBoard,
  createFolder,
  renameFolder,
  setFolderColor,
  deleteFolder,
  reorderFolders,
} from "@/lib/actions/boards";

interface BoardSummary {
  id: number;
  name: string;
  icon: string | null;
  color: string | null;
  folderId: number | null;
}

interface FolderSummary {
  id: number;
  name: string;
  color: string | null;
}

function BoardRow({
  board,
  workspaceSlug,
  folders,
}: {
  board: BoardSummary;
  workspaceSlug: string;
  folders: FolderSummary[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `board-${board.id}`,
  });
  const href = `/${workspaceSlug}/boards/${board.id}`;
  const isActive = pathname.startsWith(href);

  return (
    <SidebarMenuItem
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="group/board-row relative flex items-center gap-1"
    >
      <span
        {...attributes}
        {...listeners}
        className="cursor-grab select-none text-sidebar-foreground/40 opacity-0 group-hover/board-row:opacity-100"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </span>
      <BoardIconPicker
        value={board.icon}
        onChange={(icon) =>
          startTransition(async () => {
            await setBoardIcon(board.id, icon);
            router.refresh();
          })
        }
      />
      <SidebarMenuButton isActive={isActive} render={<Link href={href} />} className="min-w-0 flex-1">
        <InlineEditableText
          value={board.name}
          onCommit={async (next) => {
            await renameBoard(board.id, next);
            router.refresh();
          }}
          className="truncate"
        />
      </SidebarMenuButton>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="shrink-0 rounded-md p-1 text-sidebar-foreground/40 opacity-0 hover:bg-sidebar-accent group-hover/board-row:opacity-100"
          aria-label="Opções do quadro"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {folders.length > 0 && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Mover para pasta</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {board.folderId !== null && (
                  <DropdownMenuItem
                    onClick={() =>
                      startTransition(async () => {
                        await moveBoardToFolder(board.id, null);
                        router.refresh();
                      })
                    }
                  >
                    Sem pasta
                  </DropdownMenuItem>
                )}
                {folders
                  .filter((folder) => folder.id !== board.folderId)
                  .map((folder) => (
                    <DropdownMenuItem
                      key={folder.id}
                      onClick={() =>
                        startTransition(async () => {
                          await moveBoardToFolder(board.id, folder.id);
                          router.refresh();
                        })
                      }
                    >
                      {folder.name}
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() =>
              startTransition(async () => {
                await deleteBoard(board.id);
                router.refresh();
              })
            }
          >
            <Trash2 />
            Apagar quadro
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}

function FolderSection({
  folder,
  boards,
  workspaceSlug,
  folders,
}: {
  folder: FolderSummary;
  boards: BoardSummary[];
  workspaceSlug: string;
  folders: FolderSummary[];
}) {
  const [open, setOpen] = useState(true);
  const router = useRouter();
  const [, startTransition] = useTransition();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `folder-${folder.id}`,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="flex flex-col gap-0.5"
    >
      <div className="group/folder-row flex items-center gap-1 px-1 py-1">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="text-sidebar-foreground/50"
          aria-label={open ? "Recolher pasta" : "Expandir pasta"}
        >
          <ChevronRight className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-90" : ""}`} />
        </button>
        <span {...attributes} {...listeners} className="cursor-grab select-none text-sidebar-foreground/40">
          <GripVertical className="h-3.5 w-3.5" />
        </span>
        <ColorSwatchPicker
          value={folder.color ?? COLOR_PALETTE[0]}
          onChange={(color) =>
            startTransition(async () => {
              await setFolderColor(folder.id, color);
              router.refresh();
            })
          }
        />
        <InlineEditableText
          value={folder.name}
          onCommit={async (next) => {
            await renameFolder(folder.id, next);
            router.refresh();
          }}
          className="min-w-0 flex-1 truncate text-xs font-semibold"
        />
        <span className="text-[10px] text-sidebar-foreground/50">{boards.length}</span>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="shrink-0 rounded-md p-1 text-sidebar-foreground/40 opacity-0 hover:bg-sidebar-accent group-hover/folder-row:opacity-100"
            aria-label="Opções da pasta"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              variant="destructive"
              onClick={() =>
                startTransition(async () => {
                  await deleteFolder(folder.id);
                  router.refresh();
                })
              }
            >
              <Trash2 />
              Apagar pasta
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {open && (
        <div className="flex flex-col gap-0.5 pl-4">
          <SortableContext items={boards.map((b) => `board-${b.id}`)} strategy={verticalListSortingStrategy}>
            {boards.map((board) => (
              <BoardRow key={board.id} board={board} workspaceSlug={workspaceSlug} folders={folders} />
            ))}
          </SortableContext>
          {boards.length === 0 && (
            <p className="px-2 py-1 text-xs text-sidebar-foreground/40">Vazia.</p>
          )}
        </div>
      )}
    </div>
  );
}

export function AppSidebar({
  workspaceSlug,
  workspaceName,
  boards: initialBoards,
  folders: initialFolders,
}: {
  workspaceSlug: string;
  workspaceName: string;
  boards: BoardSummary[];
  folders: FolderSummary[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [boards, setBoards] = useState(initialBoards);
  const [folders, setFolders] = useState(initialFolders);
  // initialBoards/initialFolders come from the Server Component layout, which
  // only re-renders after router.refresh() (each mutation below triggers one).
  // Local state exists solely for optimistic drag-reorder; without re-syncing
  // here on every prop change, it would never pick up the revalidated data.
  const [prevInitialBoards, setPrevInitialBoards] = useState(initialBoards);
  if (initialBoards !== prevInitialBoards) {
    setPrevInitialBoards(initialBoards);
    setBoards(initialBoards);
  }
  const [prevInitialFolders, setPrevInitialFolders] = useState(initialFolders);
  if (initialFolders !== prevInitialFolders) {
    setPrevInitialFolders(initialFolders);
    setFolders(initialFolders);
  }
  const [, startTransition] = useTransition();
  const [addingBoard, setAddingBoard] = useState(false);
  const [addingFolder, setAddingFolder] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const dndId = useId();

  const unfoldered = boards.filter((b) => b.folderId === null);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId.startsWith("folder-") && overId.startsWith("folder-")) {
      const oldIndex = folders.findIndex((f) => `folder-${f.id}` === activeId);
      const newIndex = folders.findIndex((f) => `folder-${f.id}` === overId);
      const next = arrayMove(folders, oldIndex, newIndex);
      setFolders(next);
      startTransition(async () => {
        await reorderFolders(next.map((f) => f.id));
        router.refresh();
      });
      return;
    }

    if (activeId.startsWith("board-") && overId.startsWith("board-")) {
      const oldIndex = boards.findIndex((b) => `board-${b.id}` === activeId);
      const newIndex = boards.findIndex((b) => `board-${b.id}` === overId);
      const next = arrayMove(boards, oldIndex, newIndex);
      setBoards(next);
      startTransition(async () => {
        await reorderBoards(next.map((b) => b.id));
        router.refresh();
      });
    }
  }

  async function submitNewBoard() {
    const name = newBoardName.trim();
    if (!name) {
      setAddingBoard(false);
      return;
    }
    setAddingBoard(false);
    setNewBoardName("");
    startTransition(async () => {
      await quickCreateBoard(workspaceSlug, name, null);
      router.refresh();
    });
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href={`/${workspaceSlug}`} />}>
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
                {workspaceName.slice(0, 1).toUpperCase()}
              </div>
              <span className="truncate font-medium">{workspaceName}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Quadros</SidebarGroupLabel>
          <SidebarGroupContent>
            <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <div className="flex flex-col gap-1">
                <SortableContext items={folders.map((f) => `folder-${f.id}`)} strategy={verticalListSortingStrategy}>
                  {folders.map((folder) => (
                    <FolderSection
                      key={folder.id}
                      folder={folder}
                      boards={boards.filter((b) => b.folderId === folder.id)}
                      workspaceSlug={workspaceSlug}
                      folders={folders}
                    />
                  ))}
                </SortableContext>
                <SidebarMenu>
                  <SortableContext items={unfoldered.map((b) => `board-${b.id}`)} strategy={verticalListSortingStrategy}>
                    {unfoldered.map((board) => (
                      <BoardRow key={board.id} board={board} workspaceSlug={workspaceSlug} folders={folders} />
                    ))}
                  </SortableContext>
                </SidebarMenu>
                {boards.length === 0 && folders.length === 0 && (
                  <p className="px-2 py-1 text-xs text-muted-foreground">Nenhum board ainda.</p>
                )}
              </div>
            </DndContext>

            <div className="mt-2 flex flex-col gap-1">
              {addingBoard ? (
                <input
                  autoFocus
                  value={newBoardName}
                  onChange={(event) => setNewBoardName(event.target.value)}
                  onBlur={submitNewBoard}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      submitNewBoard();
                    }
                    if (event.key === "Escape") {
                      setAddingBoard(false);
                      setNewBoardName("");
                    }
                  }}
                  placeholder="Nome do quadro"
                  className="rounded-md border border-dashed border-sidebar-border bg-transparent px-2 py-1.5 text-xs outline-none focus-visible:border-ring"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingBoard(true)}
                  className="flex items-center gap-1.5 rounded-md border border-dashed border-sidebar-border px-2 py-1.5 text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Quadro
                </button>
              )}
              {addingFolder ? (
                <form
                  action={(formData) => {
                    setAddingFolder(false);
                    startTransition(async () => {
                      await createFolder(workspaceSlug, {}, formData);
                      router.refresh();
                    });
                  }}
                >
                  <input
                    autoFocus
                    name="name"
                    value={newFolderName}
                    onChange={(event) => setNewFolderName(event.target.value)}
                    onBlur={(event) => {
                      if (!newFolderName.trim()) setAddingFolder(false);
                      else event.currentTarget.form?.requestSubmit();
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") {
                        setAddingFolder(false);
                        setNewFolderName("");
                      }
                    }}
                    placeholder="Nome da pasta"
                    className="w-full rounded-md border border-dashed border-sidebar-border bg-transparent px-2 py-1.5 text-xs outline-none focus-visible:border-ring"
                  />
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingFolder(true)}
                  className="flex items-center gap-1.5 rounded-md border border-dashed border-sidebar-border px-2 py-1.5 text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground"
                >
                  <Folder className="h-3.5 w-3.5" />
                  Pasta
                </button>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname === `/${workspaceSlug}/settings`}
              render={<Link href={`/${workspaceSlug}/settings`} />}
            >
              <Settings />
              <span>Configurações</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <ThemeToggle />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

// Re-exported so callers building the icon/board default values don't need
// to reach into lib/board-icons directly for the fallback glyph.
export { DEFAULT_BOARD_ICON };
