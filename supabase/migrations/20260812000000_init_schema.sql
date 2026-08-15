-- Initial schema: workspaces, boards, groups, items, columns, views,
-- item updates/attachments, automations, notifications, and portal tokens.
-- No RLS yet — v1 is mono-workspace with manually managed members.

create type public.workspace_role as enum ('owner', 'member');
create type public.column_type as enum ('text', 'status', 'date', 'link', 'person');
create type public.view_type as enum ('table', 'calendar');
create type public.automation_trigger_type as enum ('status_changed', 'due_date_passed', 'item_created');
create type public.automation_action_type as enum ('notify_assignee', 'mark_overdue', 'show_in_portal_update', 'set_default_assignee');

create table public.workspaces (
  id bigint generated always as identity primary key,
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  constraint workspaces_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create table public.workspace_members (
  id bigint generated always as identity primary key,
  workspace_id bigint not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.workspace_role not null default 'member',
  unique (workspace_id, user_id)
);

create table public.boards (
  id bigint generated always as identity primary key,
  workspace_id bigint not null references public.workspaces (id) on delete cascade,
  name text not null,
  slug text not null,
  position integer not null default 0,
  unique (workspace_id, slug),
  constraint boards_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create index boards_workspace_id_position_idx on public.boards (workspace_id, position);

create table public.groups (
  id bigint generated always as identity primary key,
  board_id bigint not null references public.boards (id) on delete cascade,
  name text not null,
  color text,
  position integer not null default 0
);

create index groups_board_id_position_idx on public.groups (board_id, position);

create table public.columns (
  id bigint generated always as identity primary key,
  board_id bigint not null references public.boards (id) on delete cascade,
  name text not null,
  type public.column_type not null,
  config jsonb not null default '{}'::jsonb,
  position integer not null default 0
);

create index columns_board_id_position_idx on public.columns (board_id, position);

create table public.items (
  id bigint generated always as identity primary key,
  board_id bigint not null references public.boards (id) on delete cascade,
  group_id bigint not null references public.groups (id) on delete cascade,
  title text not null,
  position integer not null default 0,
  values jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index items_board_id_idx on public.items (board_id);
create index items_group_id_position_idx on public.items (group_id, position);

create table public.views (
  id bigint generated always as identity primary key,
  board_id bigint not null references public.boards (id) on delete cascade,
  name text not null,
  type public.view_type not null,
  config jsonb not null default '{}'::jsonb,
  position integer not null default 0
);

create index views_board_id_position_idx on public.views (board_id, position);

create table public.item_updates (
  id bigint generated always as identity primary key,
  item_id bigint not null references public.items (id) on delete cascade,
  author_id uuid references auth.users (id) on delete set null,
  body text not null,
  mentioned_user_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create index item_updates_item_id_idx on public.item_updates (item_id);

create table public.item_attachments (
  id bigint generated always as identity primary key,
  item_id bigint not null references public.items (id) on delete cascade,
  file_url text not null,
  file_name text not null,
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index item_attachments_item_id_idx on public.item_attachments (item_id);

create table public.automations (
  id bigint generated always as identity primary key,
  board_id bigint not null references public.boards (id) on delete cascade,
  trigger_type public.automation_trigger_type not null,
  trigger_config jsonb not null default '{}'::jsonb,
  action_type public.automation_action_type not null,
  action_config jsonb not null default '{}'::jsonb,
  enabled boolean not null default true
);

create index automations_board_id_idx on public.automations (board_id);

create table public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_id_read_idx on public.notifications (user_id, read);

create table public.portal_tokens (
  id bigint generated always as identity primary key,
  board_id bigint not null references public.boards (id) on delete cascade,
  token text not null unique,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index portal_tokens_board_id_idx on public.portal_tokens (board_id);
