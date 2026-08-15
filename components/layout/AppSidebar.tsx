"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Settings } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface BoardSummary {
  id: number;
  name: string;
}

export function AppSidebar({
  workspaceSlug,
  workspaceName,
  boards,
}: {
  workspaceSlug: string;
  workspaceName: string;
  boards: BoardSummary[];
}) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href={`/${workspaceSlug}`} />}>
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
                {workspaceName.slice(0, 1).toUpperCase()}
              </div>
              <span className="truncate font-medium">{workspaceName}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Boards</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {boards.map((board) => {
                const href = `/${workspaceSlug}/boards/${board.id}`;
                const isActive = pathname.startsWith(href);
                return (
                  <SidebarMenuItem key={board.id}>
                    <SidebarMenuButton isActive={isActive} render={<Link href={href} />}>
                      <LayoutGrid />
                      <span className="truncate">{board.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              {boards.length === 0 && (
                <p className="px-2 py-1 text-xs text-muted-foreground">Nenhum board ainda.</p>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname === `/${workspaceSlug}/settings`}
              render={<Link href={`/${workspaceSlug}/settings`} />}
            >
              <Settings />
              <span>Configurações</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
