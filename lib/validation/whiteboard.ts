import { z } from "zod";

export const WHITEBOARD_NOTE_COLORS = ["#fde68a", "#bbf7d0", "#bfdbfe", "#fbcfe8", "#e5e7eb"] as const;

export const noteTextSchema = z.string().max(2000);
export const noteColorSchema = z.enum(WHITEBOARD_NOTE_COLORS);
export const notePositionSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
});
