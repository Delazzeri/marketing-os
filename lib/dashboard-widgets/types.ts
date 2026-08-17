import type { ComponentType } from "react";
import type { ColumnType } from "@/lib/column-types/schemas";

export interface WidgetColumnData {
  id: number;
  name: string;
  type: ColumnType;
  config: Record<string, unknown>;
}

export interface WidgetItemData {
  id: number;
  title: string;
  values: Record<string, unknown>;
}

export interface WidgetConfig {
  title?: string;
  columnId?: number;
  [key: string]: unknown;
}

export interface WidgetProps {
  config: WidgetConfig;
  columns: WidgetColumnData[];
  items: WidgetItemData[];
}

export interface DashboardWidgetDefinition {
  label: string;
  render: ComponentType<WidgetProps>;
  /** Whether this widget needs a status/format/select column picked in config.columnId. */
  requiresColumn?: boolean;
}
