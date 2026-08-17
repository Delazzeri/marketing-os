-- New column type: "people" (multi-assign), alongside the existing
-- single-assign "person" type. Additive, does not touch existing data.
alter type public.column_type add value 'people';
