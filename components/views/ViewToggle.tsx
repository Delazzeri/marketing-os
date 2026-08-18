"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ViewToggle({
  hasDateColumn,
  showDashboardTab = true,
  showWhiteboardTab = true,
  view,
  onViewChange,
}: {
  hasDateColumn: boolean;
  showDashboardTab?: boolean;
  showWhiteboardTab?: boolean;
  view: string;
  onViewChange: (view: "table" | "calendar" | "dashboard" | "whiteboard") => void;
}) {
  return (
    <Tabs
      value={view}
      onValueChange={(value) => onViewChange(value as "table" | "calendar" | "dashboard" | "whiteboard")}
    >
      <TabsList>
        <TabsTrigger value="table">Tabela</TabsTrigger>
        <TabsTrigger
          value="calendar"
          disabled={!hasDateColumn}
          title={hasDateColumn ? undefined : "Crie uma coluna de Data para usar o Calendário"}
        >
          Calendário
        </TabsTrigger>
        {showDashboardTab && <TabsTrigger value="dashboard">Dashboards</TabsTrigger>}
        {showWhiteboardTab && <TabsTrigger value="whiteboard">Quadro branco</TabsTrigger>}
      </TabsList>
    </Tabs>
  );
}
