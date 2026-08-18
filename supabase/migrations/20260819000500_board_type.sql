-- Boards now come in two kinds: "standard" (rows/columns, table-based, with
-- Tabela/Calendário/Kanban/Dashboards tabs) and "whiteboard" (freeform
-- sticky-note canvas, no tabs). Existing boards default to standard.
create type public.board_type as enum ('standard', 'whiteboard');
alter table public.boards add column type public.board_type not null default 'standard';
