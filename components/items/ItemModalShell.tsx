"use client";

import { useRouter } from "next/navigation";
import { type ReactNode } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export function ItemModalShell({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
    <Dialog open onOpenChange={(open) => !open && router.back()}>
      <DialogContent className="max-w-2xl sm:max-w-2xl">
        <DialogTitle className="sr-only">Detalhes do item</DialogTitle>
        {children}
      </DialogContent>
    </Dialog>
  );
}
