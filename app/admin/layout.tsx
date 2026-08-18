import { notFound } from "next/navigation";
import { getCurrentUserContext } from "@/lib/auth/roles";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import type { ReactNode } from "react";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { isAdmin } = await getCurrentUserContext();
  if (!isAdmin) notFound();

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-6 py-3">
        <span className="text-sm font-semibold">Marketing OS · Administração</span>
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm">
            <LogOut />
            Sair
          </Button>
        </form>
      </header>
      {children}
    </div>
  );
}
