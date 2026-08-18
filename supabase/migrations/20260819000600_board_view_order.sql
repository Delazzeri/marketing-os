-- User-reorderable tab order for standard boards' Tabela/Calendário/Kanban/
-- Dashboards views. A plain ordered array, not a row-position pattern —
-- these are fixed view kinds, not rows with ids to attach a position to.
alter table public.boards
  add column view_order text[] not null default array['table', 'calendar', 'kanban', 'dashboard'];
