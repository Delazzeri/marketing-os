-- New column type: "whatsapp" (group name + message, wa.me deep-link
-- built client-side; no backend integration).
alter type public.column_type add value 'whatsapp';
