-- Row Level Security across all workspace-scoped tables.
-- Access is gated by workspace_members: a user must have a row there to read/write
-- anything under that workspace's boards. portal_tokens is intentionally left with
-- no policies for anon/authenticated — the client portal never queries it directly;
-- validation happens server-side via the service-role client (see CLAUDE.md).

create schema if not exists private;

-- Membership check, reused by every board-scoped table below.
create or replace function private.is_workspace_member(target_workspace_id bigint)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = target_workspace_id and user_id = (select auth.uid())
  );
$$;

revoke execute on function private.is_workspace_member(bigint) from public, anon, authenticated;
grant execute on function private.is_workspace_member(bigint) to authenticated;

-- Same check, resolved from a board_id — covers groups/columns/items/views/automations.
create or replace function private.is_board_member(target_board_id bigint)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.boards b
    join public.workspace_members wm on wm.workspace_id = b.workspace_id
    where b.id = target_board_id and wm.user_id = (select auth.uid())
  );
$$;

revoke execute on function private.is_board_member(bigint) from public, anon, authenticated;
grant execute on function private.is_board_member(bigint) to authenticated;

-- Same check, resolved from an item_id — covers item_updates/item_attachments.
create or replace function private.is_item_member(target_item_id bigint)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.items i
    join public.boards b on b.id = i.board_id
    join public.workspace_members wm on wm.workspace_id = b.workspace_id
    where i.id = target_item_id and wm.user_id = (select auth.uid())
  );
$$;

revoke execute on function private.is_item_member(bigint) from public, anon, authenticated;
grant execute on function private.is_item_member(bigint) to authenticated;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.boards enable row level security;
alter table public.groups enable row level security;
alter table public.columns enable row level security;
alter table public.items enable row level security;
alter table public.views enable row level security;
alter table public.item_updates enable row level security;
alter table public.item_attachments enable row level security;
alter table public.automations enable row level security;
alter table public.notifications enable row level security;
alter table public.portal_tokens enable row level security;

-- workspaces: members can read; only owners can manage.
create policy workspaces_member_read on public.workspaces
  for select to authenticated
  using ((select private.is_workspace_member(id)));

create policy workspaces_owner_write on public.workspaces
  for all to authenticated
  using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = id and wm.user_id = (select auth.uid()) and wm.role = 'owner'
    )
  )
  with check (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = id and wm.user_id = (select auth.uid()) and wm.role = 'owner'
    )
  );

-- workspace_members: members can see the roster; only owners manage membership.
create policy workspace_members_member_read on public.workspace_members
  for select to authenticated
  using ((select private.is_workspace_member(workspace_id)));

create policy workspace_members_owner_write on public.workspace_members
  for all to authenticated
  using (
    exists (
      select 1 from public.workspace_members owner_row
      where owner_row.workspace_id = workspace_members.workspace_id
        and owner_row.user_id = (select auth.uid())
        and owner_row.role = 'owner'
    )
  )
  with check (
    exists (
      select 1 from public.workspace_members owner_row
      where owner_row.workspace_id = workspace_members.workspace_id
        and owner_row.user_id = (select auth.uid())
        and owner_row.role = 'owner'
    )
  );

-- boards: any workspace member has full access (v1 has no per-board role granularity).
create policy boards_member_all on public.boards
  for all to authenticated
  using ((select private.is_workspace_member(workspace_id)))
  with check ((select private.is_workspace_member(workspace_id)));

-- groups / columns / views / automations: scoped through board_id.
create policy groups_member_all on public.groups
  for all to authenticated
  using ((select private.is_board_member(board_id)))
  with check ((select private.is_board_member(board_id)));

create policy columns_member_all on public.columns
  for all to authenticated
  using ((select private.is_board_member(board_id)))
  with check ((select private.is_board_member(board_id)));

create policy views_member_all on public.views
  for all to authenticated
  using ((select private.is_board_member(board_id)))
  with check ((select private.is_board_member(board_id)));

create policy automations_member_all on public.automations
  for all to authenticated
  using ((select private.is_board_member(board_id)))
  with check ((select private.is_board_member(board_id)));

-- items: scoped through board_id directly (avoids the extra item_id hop).
create policy items_member_all on public.items
  for all to authenticated
  using ((select private.is_board_member(board_id)))
  with check ((select private.is_board_member(board_id)));

-- item_updates / item_attachments: scoped through item_id -> board_id.
create policy item_updates_member_all on public.item_updates
  for all to authenticated
  using ((select private.is_item_member(item_id)))
  with check ((select private.is_item_member(item_id)));

create policy item_attachments_member_all on public.item_attachments
  for all to authenticated
  using ((select private.is_item_member(item_id)))
  with check ((select private.is_item_member(item_id)));

-- notifications: strictly per-user.
create policy notifications_owner_all on public.notifications
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- portal_tokens: no anon/authenticated policies — server-side service-role client only.
