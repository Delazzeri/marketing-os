"use client";

import { BarsByStatusWidget } from "./bars-by-status";
import { BarsByFormatWidget } from "./bars-by-format";
import { PieByFormatWidget } from "./pie-by-format";
import { PieByStatusWidget } from "./pie-by-status";
import { BatteryWidget } from "./battery";
import { CountersWidget } from "./counters";
import { WeeksBarsWidget } from "./weeks-bars";
import { LineRitmoWidget } from "./line-ritmo";
import type { DashboardWidgetDefinition } from "./types";
import type { DashboardWidgetType } from "@/lib/validation/dashboards";

export type { DashboardWidgetType } from "@/lib/validation/dashboards";
export type { WidgetProps, WidgetColumnData, WidgetItemData, WidgetConfig } from "./types";

export const dashboardWidgetRegistry: Record<DashboardWidgetType, DashboardWidgetDefinition> = {
  bars_by_status: { label: "Barras por status", render: BarsByStatusWidget, requiresColumn: true },
  bars_by_format: { label: "Barras por formato", render: BarsByFormatWidget, requiresColumn: true },
  pie_by_format: { label: "Pizza por formato", render: PieByFormatWidget, requiresColumn: true },
  pie_by_status: { label: "Pizza por status", render: PieByStatusWidget, requiresColumn: true },
  battery: { label: "Bateria de progresso", render: BatteryWidget, requiresColumn: true },
  counters: { label: "Contadores", render: CountersWidget, requiresColumn: true },
  weeks_bars: { label: "Itens por semana", render: WeeksBarsWidget, requiresColumn: true },
  line_ritmo: { label: "Ritmo acumulado", render: LineRitmoWidget, requiresColumn: true },
};
