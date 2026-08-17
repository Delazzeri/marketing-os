-- New column type: "select" (general-purpose dropdown, neutral chips),
-- distinct from "status" which carries workflow semantics/automations.
alter type public.column_type add value 'select';
