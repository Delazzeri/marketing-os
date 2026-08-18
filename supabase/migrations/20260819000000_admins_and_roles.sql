-- Multi-tenant roles: a global `admin` role (sees/manages every workspace
-- without needing a workspace_members row) plus two new per-workspace roles,
-- `coordinator` (manages people within their own workspace) and `viewer`
-- (read-only). `owner`/`member` stay in the enum for backward compatibility
-- with existing rows, but new invites only ever pick coordinator/member/viewer.

create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

alter table public.admins enable row level security;
-- No policies for anon/authenticated — same convention as portal_tokens.
-- Only the service-role client (lib/supabase/service.ts) touches this table.

alter type public.workspace_role add value 'coordinator';
alter type public.workspace_role add value 'viewer';

-- Global admin check, reused by every helper below.
create or replace function private.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.admins where user_id = (select auth.uid())
  );
$$;

revoke execute on function private.is_admin() from public, anon, authenticated;
grant execute on function private.is_admin() to authenticated;

-- Read-access helpers gain an admin bypass — admins have no workspace_members
-- row, so without this they'd fail every membership check.
create or replace function private.is_workspace_member(target_workspace_id bigint)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select private.is_admin() or exists (
    select 1 from public.workspace_members
    where workspace_id = target_workspace_id and user_id = (select auth.uid())
  );
$$;

create or replace function private.is_board_member(target_board_id bigint)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select private.is_admin() or exists (
    select 1
    from public.boards b
    join public.workspace_members wm on wm.workspace_id = b.workspace_id
    where b.id = target_board_id and wm.user_id = (select auth.uid())
  );
$$;

create or replace function private.is_item_member(target_item_id bigint)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select private.is_admin() or exists (
    select 1
    from public.items i
    join public.boards b on b.id = i.board_id
    join public.workspace_members wm on wm.workspace_id = b.workspace_id
    where i.id = target_item_id and wm.user_id = (select auth.uid())
  );
$$;

-- Write-access helpers: same membership shape, but excludes `viewer` — used
-- by insert/update/delete policies on the "member = full CRUD" tables so a
-- viewer can still read everything via the functions above but can't write.
create or replace function private.can_write_workspace(target_workspace_id bigint)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select private.is_admin() or exists (
    select 1 from public.workspace_members
    where workspace_id = target_workspace_id
      and user_id = (select auth.uid())
      and role in ('owner', 'coordinator', 'member')
  );
$$;

create or replace function private.can_write_board(target_board_id bigint)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select private.is_admin() or exists (
    select 1
    from public.boards b
    join public.workspace_members wm on wm.workspace_id = b.workspace_id
    where b.id = target_board_id
      and wm.user_id = (select auth.uid())
      and wm.role in ('owner', 'coordinator', 'member')
  );
$$;

create or replace function private.can_write_item(target_item_id bigint)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select private.is_admin() or exists (
    select 1
    from public.items i
    join public.boards b on b.id = i.board_id
    join public.workspace_members wm on wm.workspace_id = b.workspace_id
    where i.id = target_item_id
      and wm.user_id = (select auth.uid())
      and wm.role in ('owner', 'coordinator', 'member')
  );
$$;

revoke execute on function private.can_write_workspace(bigint) from public, anon, authenticated;
revoke execute on function private.can_write_board(bigint) from public, anon, authenticated;
revoke execute on function private.can_write_item(bigint) from public, anon, authenticated;
grant execute on function private.can_write_workspace(bigint) to authenticated;
grant execute on function private.can_write_board(bigint) to authenticated;
grant execute on function private.can_write_item(bigint) to authenticated;

-- Split each "member = full CRUD" table's single `for all` policy into a
-- read policy (any member/coordinator/viewer, or admin) and a write policy
-- (excludes viewer). boards is workspace-scoped directly; the rest go
-- through board_id or item_id, matching the existing helper functions.

drop policy boards_member_all on public.boards;
create policy boards_member_read on public.boards
  for select to authenticated
  using ((select private.is_workspace_member(workspace_id)));
create policy boards_member_write on public.boards
  for insert to authenticated
  with check ((select private.can_write_workspace(workspace_id)));
create policy boards_member_update on public.boards
  for update to authenticated
  using ((select private.can_write_workspace(workspace_id)))
  with check ((select private.can_write_workspace(workspace_id)));
create policy boards_member_delete on public.boards
  for delete to authenticated
  using ((select private.can_write_workspace(workspace_id)));

drop policy groups_member_all on public.groups;
create policy groups_member_read on public.groups
  for select to authenticated
  using ((select private.is_board_member(board_id)));
create policy groups_member_write on public.groups
  for insert to authenticated
  with check ((select private.can_write_board(board_id)));
create policy groups_member_update on public.groups
  for update to authenticated
  using ((select private.can_write_board(board_id)))
  with check ((select private.can_write_board(board_id)));
create policy groups_member_delete on public.groups
  for delete to authenticated
  using ((select private.can_write_board(board_id)));

drop policy columns_member_all on public.columns;
create policy columns_member_read on public.columns
  for select to authenticated
  using ((select private.is_board_member(board_id)));
create policy columns_member_write on public.columns
  for insert to authenticated
  with check ((select private.can_write_board(board_id)));
create policy columns_member_update on public.columns
  for update to authenticated
  using ((select private.can_write_board(board_id)))
  with check ((select private.can_write_board(board_id)));
create policy columns_member_delete on public.columns
  for delete to authenticated
  using ((select private.can_write_board(board_id)));

drop policy views_member_all on public.views;
create policy views_member_read on public.views
  for select to authenticated
  using ((select private.is_board_member(board_id)));
create policy views_member_write on public.views
  for insert to authenticated
  with check ((select private.can_write_board(board_id)));
create policy views_member_update on public.views
  for update to authenticated
  using ((select private.can_write_board(board_id)))
  with check ((select private.can_write_board(board_id)));
create policy views_member_delete on public.views
  for delete to authenticated
  using ((select private.can_write_board(board_id)));

drop policy automations_member_all on public.automations;
create policy automations_member_read on public.automations
  for select to authenticated
  using ((select private.is_board_member(board_id)));
create policy automations_member_write on public.automations
  for insert to authenticated
  with check ((select private.can_write_board(board_id)));
create policy automations_member_update on public.automations
  for update to authenticated
  using ((select private.can_write_board(board_id)))
  with check ((select private.can_write_board(board_id)));
create policy automations_member_delete on public.automations
  for delete to authenticated
  using ((select private.can_write_board(board_id)));

drop policy items_member_all on public.items;
create policy items_member_read on public.items
  for select to authenticated
  using ((select private.is_board_member(board_id)));
create policy items_member_write on public.items
  for insert to authenticated
  with check ((select private.can_write_board(board_id)));
create policy items_member_update on public.items
  for update to authenticated
  using ((select private.can_write_board(board_id)))
  with check ((select private.can_write_board(board_id)));
create policy items_member_delete on public.items
  for delete to authenticated
  using ((select private.can_write_board(board_id)));

drop policy item_updates_member_all on public.item_updates;
create policy item_updates_member_read on public.item_updates
  for select to authenticated
  using ((select private.is_item_member(item_id)));
create policy item_updates_member_write on public.item_updates
  for insert to authenticated
  with check ((select private.can_write_item(item_id)));
create policy item_updates_member_update on public.item_updates
  for update to authenticated
  using ((select private.can_write_item(item_id)))
  with check ((select private.can_write_item(item_id)));
create policy item_updates_member_delete on public.item_updates
  for delete to authenticated
  using ((select private.can_write_item(item_id)));

drop policy item_attachments_member_all on public.item_attachments;
create policy item_attachments_member_read on public.item_attachments
  for select to authenticated
  using ((select private.is_item_member(item_id)));
create policy item_attachments_member_write on public.item_attachments
  for insert to authenticated
  with check ((select private.can_write_item(item_id)));
create policy item_attachments_member_update on public.item_attachments
  for update to authenticated
  using ((select private.can_write_item(item_id)))
  with check ((select private.can_write_item(item_id)));
create policy item_attachments_member_delete on public.item_attachments
  for delete to authenticated
  using ((select private.can_write_item(item_id)));

-- workspaces: only admin creates new workspaces. Update/delete stays scoped
-- to the workspace's own owner row (legacy) or admin.
drop policy workspaces_owner_write on public.workspaces;
create policy workspaces_admin_insert on public.workspaces
  for insert to authenticated
  with check ((select private.is_admin()));

drop policy workspaces_owner_update on public.workspaces;
create policy workspaces_owner_update on public.workspaces
  for update to authenticated
  using (
    (select private.is_admin()) or exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = id and wm.user_id = (select auth.uid()) and wm.role = 'owner'
    )
  )
  with check (
    (select private.is_admin()) or exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = id and wm.user_id = (select auth.uid()) and wm.role = 'owner'
    )
  );

drop policy workspaces_owner_delete on public.workspaces;
create policy workspaces_owner_delete on public.workspaces
  for delete to authenticated
  using (
    (select private.is_admin()) or exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = id and wm.user_id = (select auth.uid()) and wm.role = 'owner'
    )
  );

-- workspace_members: coordinator (in addition to legacy owner) manages
-- people within their own workspace; admin bypasses everywhere.
drop policy workspace_members_owner_insert on public.workspace_members;
create policy workspace_members_manage_insert on public.workspace_members
  for insert to authenticated
  with check (
    (select private.is_admin()) or exists (
      select 1 from public.workspace_members owner_row
      where owner_row.workspace_id = workspace_members.workspace_id
        and owner_row.user_id = (select auth.uid())
        and owner_row.role in ('owner', 'coordinator')
    )
  );

drop policy workspace_members_owner_update on public.workspace_members;
create policy workspace_members_manage_update on public.workspace_members
  for update to authenticated
  using (
    (select private.is_admin()) or exists (
      select 1 from public.workspace_members owner_row
      where owner_row.workspace_id = workspace_members.workspace_id
        and owner_row.user_id = (select auth.uid())
        and owner_row.role in ('owner', 'coordinator')
    )
  )
  with check (
    (select private.is_admin()) or exists (
      select 1 from public.workspace_members owner_row
      where owner_row.workspace_id = workspace_members.workspace_id
        and owner_row.user_id = (select auth.uid())
        and owner_row.role in ('owner', 'coordinator')
    )
  );

drop policy workspace_members_owner_delete on public.workspace_members;
create policy workspace_members_manage_delete on public.workspace_members
  for delete to authenticated
  using (
    (select private.is_admin()) or exists (
      select 1 from public.workspace_members owner_row
      where owner_row.workspace_id = workspace_members.workspace_id
        and owner_row.user_id = (select auth.uid())
        and owner_row.role in ('owner', 'coordinator')
    )
  );
