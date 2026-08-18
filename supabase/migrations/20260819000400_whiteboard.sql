-- "Quadro branco" board view: freeform draggable sticky notes connected by
-- lines (Miro-style). Board-scoped, same read/write split shape as
-- dashboards/dashboard_widgets.
create table public.whiteboard_notes (
  id bigint generated always as identity primary key,
  board_id bigint not null references public.boards (id) on delete cascade,
  text text not null default '',
  color text not null default '#fde68a',
  position_x double precision not null default 0,
  position_y double precision not null default 0,
  created_at timestamptz not null default now()
);

create table public.whiteboard_connections (
  id bigint generated always as identity primary key,
  board_id bigint not null references public.boards (id) on delete cascade,
  from_note_id bigint not null references public.whiteboard_notes (id) on delete cascade,
  to_note_id bigint not null references public.whiteboard_notes (id) on delete cascade
);

alter table public.whiteboard_notes enable row level security;
alter table public.whiteboard_connections enable row level security;

create policy whiteboard_notes_member_read on public.whiteboard_notes
  for select to authenticated
  using ((select private.is_board_member(board_id)));
create policy whiteboard_notes_member_write on public.whiteboard_notes
  for insert to authenticated
  with check ((select private.can_write_board(board_id)));
create policy whiteboard_notes_member_update on public.whiteboard_notes
  for update to authenticated
  using ((select private.can_write_board(board_id)))
  with check ((select private.can_write_board(board_id)));
create policy whiteboard_notes_member_delete on public.whiteboard_notes
  for delete to authenticated
  using ((select private.can_write_board(board_id)));

create policy whiteboard_connections_member_read on public.whiteboard_connections
  for select to authenticated
  using ((select private.is_board_member(board_id)));
create policy whiteboard_connections_member_write on public.whiteboard_connections
  for insert to authenticated
  with check ((select private.can_write_board(board_id)));
create policy whiteboard_connections_member_delete on public.whiteboard_connections
  for delete to authenticated
  using ((select private.can_write_board(board_id)));
