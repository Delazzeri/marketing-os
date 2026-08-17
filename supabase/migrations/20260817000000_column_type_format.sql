-- New column type for the Nocturne redesign: "format" (Reels/Carrossel/Story),
-- same shape as status but with its own label/palette semantics.
alter type public.column_type add value 'format';
