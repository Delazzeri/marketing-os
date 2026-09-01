"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import ReactFlow, {
  Background,
  Controls,
  Handle,
  Position,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
  type OnConnect,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  createConnection,
  createNote,
  deleteConnection,
  deleteNote,
  setNoteColor,
  updateNotePosition,
  updateNoteText,
} from "@/lib/actions/whiteboard";
import { WHITEBOARD_NOTE_COLORS } from "@/lib/validation/whiteboard";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NoteData {
  id: number;
  text: string;
  color: string;
  positionX: number;
  positionY: number;
}

interface ConnectionData {
  id: number;
  fromNoteId: number;
  toNoteId: number;
}

function StickyNote({ id, data }: NodeProps<{ text: string; color: string; canEdit: boolean }>) {
  const noteId = Number(id);
  const [, startTransition] = useTransition();
  const [text, setText] = useState(data.text);
  const [color, setColor] = useState(data.color);

  return (
    <div
      className="group relative flex min-h-[100px] w-[180px] flex-col gap-1 rounded-md p-3 shadow-md"
      style={{ backgroundColor: color }}
    >
      <Handle type="target" position={Position.Left} className="!h-3 !w-3" />
      <Handle type="source" position={Position.Right} className="!h-3 !w-3" />
      {data.canEdit && (
        <button
          type="button"
          onClick={() => startTransition(() => deleteNote(noteId))}
          className="absolute top-1 right-1 rounded p-0.5 text-black/40 opacity-0 hover:bg-black/10 group-hover:opacity-100"
          title="Excluir anotação"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      <textarea
        value={text}
        readOnly={!data.canEdit}
        onChange={(event) => {
          setText(event.target.value);
          const el = event.target;
          el.style.height = "auto";
          el.style.height = `${el.scrollHeight}px`;
        }}
        ref={(el) => {
          if (el) {
            el.style.height = "auto";
            el.style.height = `${el.scrollHeight}px`;
          }
        }}
        onBlur={() => {
          if (text !== data.text) startTransition(() => updateNoteText(noteId, text));
        }}
        className="nodrag min-h-[70px] resize-none overflow-hidden bg-transparent text-sm text-black/80 outline-none placeholder:text-black/40"
        placeholder="Escreva algo..."
      />
      {data.canEdit && (
        <div className="nodrag flex items-center gap-1 opacity-0 group-hover:opacity-100">
          {WHITEBOARD_NOTE_COLORS.map((swatch) => (
            <button
              key={swatch}
              type="button"
              onClick={() => {
                setColor(swatch);
                startTransition(() => setNoteColor(noteId, swatch));
              }}
              className={cn(
                "h-3.5 w-3.5 rounded-full border border-black/20",
                color === swatch && "ring-2 ring-black/40",
              )}
              style={{ backgroundColor: swatch }}
              aria-label={swatch}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const nodeTypes = { stickyNote: StickyNote };

export function WhiteboardView({
  boardId,
  notes,
  connections,
  canEdit,
}: {
  boardId: number;
  notes: NoteData[];
  connections: ConnectionData[];
  canEdit: boolean;
}) {
  const [, startTransition] = useTransition();

  const initialNodes = useMemo<Node[]>(
    () =>
      notes.map((note) => ({
        id: String(note.id),
        type: "stickyNote",
        position: { x: note.positionX, y: note.positionY },
        data: { text: note.text, color: note.color, canEdit },
        draggable: canEdit,
      })),
    [notes, canEdit],
  );

  const initialEdges = useMemo<Edge[]>(
    () =>
      connections.map((connection) => ({
        id: String(connection.id),
        source: String(connection.fromNoteId),
        target: String(connection.toNoteId),
      })),
    [connections],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // useNodesState/useEdgesState only seed their internal state once on
  // mount — they don't resync when `notes`/`connections` change on
  // re-render (e.g. after revalidatePath following createNote). Same
  // render-time prop-resync pattern as BoardTable.tsx's useResizableWidth
  // and BoardContent.tsx's prevGroups, instead of useEffect.
  const [prevNotes, setPrevNotes] = useState(notes);
  if (notes !== prevNotes) {
    setPrevNotes(notes);
    setNodes(initialNodes);
  }
  const [prevConnections, setPrevConnections] = useState(connections);
  if (connections !== prevConnections) {
    setPrevConnections(connections);
    setEdges(initialEdges);
  }

  const handleNodeDragStop = useCallback(
    (_event: unknown, node: Node) => {
      startTransition(() => updateNotePosition(Number(node.id), { x: node.position.x, y: node.position.y }));
    },
    [startTransition],
  );

  const handleConnect: OnConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      setEdges((current) => addEdge(connection, current));
      startTransition(() =>
        createConnection(boardId, Number(connection.source), Number(connection.target)).catch(() => {
          setEdges((current) =>
            current.filter((edge) => !(edge.source === connection.source && edge.target === connection.target)),
          );
        }),
      );
    },
    [boardId, setEdges, startTransition],
  );

  const handleEdgesDelete = useCallback(
    (deleted: Edge[]) => {
      for (const edge of deleted) {
        startTransition(() => deleteConnection(Number(edge.id)));
      }
    },
    [startTransition],
  );

  function handleAddNote() {
    const position = { x: 80 + Math.random() * 200, y: 80 + Math.random() * 200 };
    const tempId = `temp-${Date.now()}`;
    const tempNode: Node = {
      id: tempId,
      type: "stickyNote",
      position,
      data: { text: "", color: WHITEBOARD_NOTE_COLORS[0], canEdit },
      draggable: canEdit,
    };
    setNodes((current) => [...current, tempNode]);
    startTransition(async () => {
      try {
        const created = await createNote(boardId, position);
        setNodes((current) =>
          current.map((node) => (node.id === tempId ? { ...node, id: String(created.id) } : node)),
        );
      } catch {
        setNodes((current) => current.filter((node) => node.id !== tempId));
      }
    });
  }

  return (
    <div className="relative h-[70vh] w-full overflow-hidden rounded-lg border border-border/60">
      {canEdit && (
        <Button
          type="button"
          size="sm"
          onClick={handleAddNote}
          className="absolute top-3 left-3 z-10"
        >
          <Plus />
          Anotação
        </Button>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={canEdit ? onNodesChange : undefined}
        onEdgesChange={canEdit ? onEdgesChange : undefined}
        onNodeDragStop={canEdit ? handleNodeDragStop : undefined}
        onConnect={canEdit ? handleConnect : undefined}
        onEdgesDelete={canEdit ? handleEdgesDelete : undefined}
        nodeTypes={nodeTypes}
        nodesConnectable={canEdit}
        nodesDraggable={canEdit}
        elementsSelectable={canEdit}
        fitView
      >
        <Background />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
