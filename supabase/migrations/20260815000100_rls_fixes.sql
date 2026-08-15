-- Fix advisor findings from the RLS migration:
-- 1. workspaces/workspace_members had overlapping permissive SELECT policies
--    (the owner "for all" policy duplicated the member "read" policy for SELECT).
--    Narrow the owner policies to the write actions only.
-- 2. Add covering indexes for FKs used in RLS lookups and left previously unindexed.

drop policy workspaces_owner_write on public.workspaces;
create policy workspaces_owner_write on public.workspaces
  for insert to authenticated
  with check (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = id and wm.user_id = (select auth.uid()) and wm.role = 'owner'
    )
  );

create policy workspaces_owner_update on public.workspaces
  for update to authenticated
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

create policy workspaces_owner_delete on public.workspaces
  for delete to authenticated
  using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = id and wm.user_id = (select auth.uid()) and wm.role = 'owner'
    )
  );

drop policy workspace_members_owner_write on public.workspace_members;
create policy workspace_members_owner_insert on public.workspace_members
  for insert to authenticated
  with check (
    exists (
      select 1 from public.workspace_members owner_row
      where owner_row.workspace_id = workspace_members.workspace_id
        and owner_row.user_id = (select auth.uid())
        and owner_row.role = 'owner'
    )
  );

create policy workspace_members_owner_update on public.workspace_members
  for update to authenticated
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

create policy workspace_members_owner_delete on public.workspace_members
  for delete to authenticated
  using (
    exists (
      select 1 from public.workspace_members owner_row
      where owner_row.workspace_id = workspace_members.workspace_id
        and owner_row.user_id = (select auth.uid())
        and owner_row.role = 'owner'
    )
  );

create index workspace_members_user_id_idx on public.workspace_members (user_id);
create index items_created_by_idx on public.items (created_by);
create index item_updates_author_id_idx on public.item_updates (author_id);
create index item_attachments_uploaded_by_idx on public.item_attachments (uploaded_by);
