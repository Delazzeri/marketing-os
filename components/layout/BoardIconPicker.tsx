"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BOARD_ICONS, DEFAULT_BOARD_ICON } from "@/lib/board-icons";

export function BoardIconPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (icon: string) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-sm hover:bg-sidebar-accent"
        aria-label="Trocar ícone"
      >
        {value ?? DEFAULT_BOARD_ICON}
      </PopoverTrigger>
      <PopoverContent className="w-56">
        <div className="grid grid-cols-6 gap-1">
          {BOARD_ICONS.map((icon) => (
            <button
              key={icon.title}
              type="button"
              title={icon.title}
              onClick={() => onChange(icon.glyph)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-sm hover:bg-accent"
            >
              {icon.glyph}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
