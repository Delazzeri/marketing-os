"use client";

import { useRouter } from "next/navigation";
import { type ReactNode } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export function ItemModalShell({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
    <Sheet open onOpenChange={(open) => !open && router.back()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-[620px]">
        <SheetHeader>
          <SheetTitle className="sr-only">Detalhes do item</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-6 px-4 pb-4">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
