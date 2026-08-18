"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { SidebarMenuButton } from "@/components/ui/sidebar";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <SidebarMenuButton
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Alternar tema"
      tooltip={resolvedTheme === "dark" ? "Tema claro" : "Tema escuro"}
      className="group-data-[collapsible=icon]:justify-center"
    >
      <Sun className="hidden dark:block" />
      <Moon className="block dark:hidden" />
      <span className="hidden group-data-[collapsible=icon]:hidden dark:inline">Tema claro</span>
      <span className="inline group-data-[collapsible=icon]:hidden dark:hidden">Tema escuro</span>
    </SidebarMenuButton>
  );
}
