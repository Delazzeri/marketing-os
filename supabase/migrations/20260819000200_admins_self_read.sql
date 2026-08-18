-- Lets a user check "am I an admin?" from the RLS-bound client without
-- exposing the full admin roster to non-admins (each row is only visible
-- to the user_id it belongs to).
create policy admins_self_read on public.admins
  for select to authenticated
  using (user_id = (select auth.uid()));
