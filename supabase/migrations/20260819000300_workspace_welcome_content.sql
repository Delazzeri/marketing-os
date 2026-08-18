-- Per-workspace onboarding/welcome screen content, editable by admin/coordinator.
alter table public.workspaces
  add column welcome_message text,
  add column welcome_links jsonb not null default '[]'::jsonb;

-- Fix a pre-existing bug: these policies compared workspace_members.workspace_id
-- to workspace_members.id (self-comparison) instead of workspaces.id, so a
-- non-admin owner could never actually update/delete their own workspace row.
-- Also extend to coordinator, since coordinators must be able to edit the
-- welcome content of their own workspace.
drop policy workspaces_owner_update on public.workspaces;
create policy workspaces_owner_update on public.workspaces
  for update to authenticated
  using (
    private.is_admin() or exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = workspaces.id
        and wm.user_id = (select auth.uid())
        and wm.role in ('owner', 'coordinator')
    )
  )
  with check (
    private.is_admin() or exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = workspaces.id
        and wm.user_id = (select auth.uid())
        and wm.role in ('owner', 'coordinator')
    )
  );

drop policy workspaces_owner_delete on public.workspaces;
create policy workspaces_owner_delete on public.workspaces
  for delete to authenticated
  using (
    private.is_admin() or exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = workspaces.id
        and wm.user_id = (select auth.uid())
        and wm.role = 'owner'
    )
  );
