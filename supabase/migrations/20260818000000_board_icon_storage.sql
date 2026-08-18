-- Storage bucket for uploaded board logos (replaces the emoji-icon picker
-- with a real image upload option). Public bucket since board icons are
-- purely cosmetic and already exposed to anyone with the board's Portal
-- link — no reason to gate reads behind auth. Writes stay authenticated-only.

insert into storage.buckets (id, name, public)
values ('board-icons', 'board-icons', true)
on conflict (id) do nothing;

create policy board_icons_public_read on storage.objects
  for select to public
  using (bucket_id = 'board-icons');

create policy board_icons_authenticated_write on storage.objects
  for insert to authenticated
  with check (bucket_id = 'board-icons');

create policy board_icons_authenticated_update on storage.objects
  for update to authenticated
  using (bucket_id = 'board-icons')
  with check (bucket_id = 'board-icons');

create policy board_icons_authenticated_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'board-icons');

-- boards.icon already stores the emoji glyph as text; reuse it to store the
-- uploaded image's public URL instead (distinguished by a simple prefix
-- check in the app, no schema change needed).
