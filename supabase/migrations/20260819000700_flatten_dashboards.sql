-- Remove the "named dashboards" layer: widgets now belong directly to a
-- board (one flat panel per board), not to a named dashboard within it.

-- Old policies reference dashboard_id (via a join through dashboards), so
-- they must go before the column that backs them does.
drop policy dashboard_widgets_member_read on public.dashboard_widgets;
drop policy dashboard_widgets_member_write on public.dashboard_widgets;
drop policy dashboard_widgets_member_update on public.dashboard_widgets;
drop policy dashboard_widgets_member_delete on public.dashboard_widgets;

alter table public.dashboard_widgets add column board_id bigint references public.boards (id) on delete cascade;

update public.dashboard_widgets dw
  set board_id = d.board_id
  from public.dashboards d
  where d.id = dw.dashboard_id;

alter table public.dashboard_widgets alter column board_id set not null;
alter table public.dashboard_widgets drop column dashboard_id;

-- Dropping dashboards cascades away its own policies.
drop table public.dashboards;

create index dashboard_widgets_board_id_position_idx on public.dashboard_widgets (board_id, position);

create policy dashboard_widgets_member_read on public.dashboard_widgets
  for select to authenticated
  using ((select private.is_board_member(board_id)));
create policy dashboard_widgets_member_write on public.dashboard_widgets
  for insert to authenticated
  with check ((select private.can_write_board(board_id)));
create policy dashboard_widgets_member_update on public.dashboard_widgets
  for update to authenticated
  using ((select private.can_write_board(board_id)))
  with check ((select private.can_write_board(board_id)));
create policy dashboard_widgets_member_delete on public.dashboard_widgets
  for delete to authenticated
  using ((select private.can_write_board(board_id)));
