-- Width of the built-in "Item" column (title) in the board table view.
-- Unlike user-defined columns, it isn't a row in `columns`, so its width
-- lives directly on the board it belongs to.
alter table public.boards add column item_column_width integer;
