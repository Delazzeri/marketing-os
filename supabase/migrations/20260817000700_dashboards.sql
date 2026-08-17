-- Dashboards: board-scoped collections of widgets. Each dashboard is
-- selectable like a view (paired conceptually with views.type = 'dashboard',
-- though dashboards are their own tables rather than living in views.config
-- since a board can have multiple dashboards, each with several widgets).
create type public.dashboard_widget_type as enum (
  'bars_by_status',
  'bars_by_format',
  'pie_by_format',
  'pie_by_status',
  'battery',
  'counters',
  'weeks_bars',
  'line_ritmo'
);

create table public.dashboards (
  id bigint generated always as identity primary key,
  board_id bigint not null references public.boards (id) on delete cascade,
  name text not null,
  position integer not null default 0
);

create index dashboards_board_id_position_idx on public.dashboards (board_id, position);

create table public.dashboard_widgets (
  id bigint generated always as identity primary key,
  dashboard_id bigint not null references public.dashboards (id) on delete cascade,
  type public.dashboard_widget_type not null,
  config jsonb not null default '{}'::jsonb,
  position integer not null default 0
);

create index dashboard_widgets_dashboard_id_position_idx on public.dashboard_widgets (dashboard_id, position);

alter table public.dashboards enable row level security;
alter table public.dashboard_widgets enable row level security;

create policy dashboards_member_all on public.dashboards
  for all to authenticated
  using ((select private.is_board_member(board_id)))
  with check ((select private.is_board_member(board_id)));

-- dashboard_widgets: scoped through dashboards.board_id (one hop further
-- than the board-scoped tables in 20260815000000_rls_policies.sql).
create policy dashboard_widgets_member_all on public.dashboard_widgets
  for all to authenticated
  using (
    exists (
      select 1 from public.dashboards
      where dashboards.id = dashboard_widgets.dashboard_id
        and (select private.is_board_member(dashboards.board_id))
    )
  )
  with check (
    exists (
      select 1 from public.dashboards
      where dashboards.id = dashboard_widgets.dashboard_id
        and (select private.is_board_member(dashboards.board_id))
    )
  );
