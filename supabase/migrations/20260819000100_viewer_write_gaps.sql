-- Closes a gap the previous migration missed: board_folders, dashboards,
-- and dashboard_widgets were added after the original RLS policies file and
-- still use the old single `for all` shape (read == write, no viewer
-- exclusion). Split them the same way as boards/groups/columns/etc.

drop policy board_folders_member_all on public.board_folders;
create policy board_folders_member_read on public.board_folders
  for select to authenticated
  using ((select private.is_workspace_member(workspace_id)));
create policy board_folders_member_write on public.board_folders
  for insert to authenticated
  with check ((select private.can_write_workspace(workspace_id)));
create policy board_folders_member_update on public.board_folders
  for update to authenticated
  using ((select private.can_write_workspace(workspace_id)))
  with check ((select private.can_write_workspace(workspace_id)));
create policy board_folders_member_delete on public.board_folders
  for delete to authenticated
  using ((select private.can_write_workspace(workspace_id)));

drop policy dashboards_member_all on public.dashboards;
create policy dashboards_member_read on public.dashboards
  for select to authenticated
  using ((select private.is_board_member(board_id)));
create policy dashboards_member_write on public.dashboards
  for insert to authenticated
  with check ((select private.can_write_board(board_id)));
create policy dashboards_member_update on public.dashboards
  for update to authenticated
  using ((select private.can_write_board(board_id)))
  with check ((select private.can_write_board(board_id)));
create policy dashboards_member_delete on public.dashboards
  for delete to authenticated
  using ((select private.can_write_board(board_id)));

drop policy dashboard_widgets_member_all on public.dashboard_widgets;
create policy dashboard_widgets_member_read on public.dashboard_widgets
  for select to authenticated
  using (
    exists (
      select 1 from public.dashboards
      where dashboards.id = dashboard_widgets.dashboard_id
        and (select private.is_board_member(dashboards.board_id))
    )
  );
create policy dashboard_widgets_member_write on public.dashboard_widgets
  for insert to authenticated
  with check (
    exists (
      select 1 from public.dashboards
      where dashboards.id = dashboard_widgets.dashboard_id
        and (select private.can_write_board(dashboards.board_id))
    )
  );
create policy dashboard_widgets_member_update on public.dashboard_widgets
  for update to authenticated
  using (
    exists (
      select 1 from public.dashboards
      where dashboards.id = dashboard_widgets.dashboard_id
        and (select private.can_write_board(dashboards.board_id))
    )
  )
  with check (
    exists (
      select 1 from public.dashboards
      where dashboards.id = dashboard_widgets.dashboard_id
        and (select private.can_write_board(dashboards.board_id))
    )
  );
create policy dashboard_widgets_member_delete on public.dashboard_widgets
  for delete to authenticated
  using (
    exists (
      select 1 from public.dashboards
      where dashboards.id = dashboard_widgets.dashboard_id
        and (select private.can_write_board(dashboards.board_id))
    )
  );
