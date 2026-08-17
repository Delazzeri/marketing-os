-- Board folders (sidebar organization) and per-board icon/color, per the
-- Nocturne redesign. Folders are workspace-scoped, boards optionally belong
-- to one folder.

create table public.board_folders (
  id bigint generated always as identity primary key,
  workspace_id bigint not null references public.workspaces (id) on delete cascade,
  name text not null,
  color text,
  position integer not null default 0
);

create index board_folders_workspace_id_position_idx on public.board_folders (workspace_id, position);

alter table public.boards add column folder_id bigint references public.board_folders (id) on delete set null;
alter table public.boards add column color text;
alter table public.boards add column icon text;

create index boards_folder_id_idx on public.boards (folder_id);

alter table public.board_folders enable row level security;

-- board_folders: any workspace member has full access, mirrors boards_member_all.
create policy board_folders_member_all on public.board_folders
  for all to authenticated
  using ((select private.is_workspace_member(workspace_id)))
  with check ((select private.is_workspace_member(workspace_id)));
