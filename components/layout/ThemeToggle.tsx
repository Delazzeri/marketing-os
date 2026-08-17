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
    >
      <Sun className="hidden dark:block" />
      <Moon className="block dark:hidden" />
      <span className="hidden dark:inline">Tema claro</span>
      <span className="inline dark:hidden">Tema escuro</span>
    </SidebarMenuButton>
  );
}
