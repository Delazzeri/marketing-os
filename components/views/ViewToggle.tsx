"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ViewToggle({
  hasDateColumn,
  showDashboardTab = true,
}: {
  hasDateColumn: boolean;
  showDashboardTab?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawView = searchParams.get("view");
  const active = rawView === "calendar" || rawView === "dashboard" ? rawView : "table";

  function setView(view: string) {
    const params = new URLSearchParams(searchParams);
    if (view === "table") {
      params.delete("view");
    } else {
      params.set("view", view);
    }
    router.push(`?${params.toString()}`);
  }

  return (
    <Tabs value={active} onValueChange={setView}>
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
      </TabsList>
    </Tabs>
  );
}
