import { z } from "zod";

export const dashboardWidgetTypeSchema = z.enum([
  "bars_by_status",
  "bars_by_format",
  "pie_by_format",
  "pie_by_status",
  "battery",
  "counters",
  "weeks_bars",
  "line_ritmo",
]);

export type DashboardWidgetType = z.infer<typeof dashboardWidgetTypeSchema>;

export const dashboardFieldsSchema = z.object({
  name: z.string().min(1, "Obrigatório"),
});

export type DashboardFields = z.infer<typeof dashboardFieldsSchema>;

export const widgetConfigSchema = z.object({
  title: z.string().optional(),
  columnId: z.coerce.number().int().positive().optional(),
});

export const widgetFieldsSchema = z.object({
  type: dashboardWidgetTypeSchema,
  config: widgetConfigSchema.default({}),
});

export type WidgetFields = z.infer<typeof widgetFieldsSchema>;
