"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { COLOR_PALETTE } from "@/lib/column-types/color-palette";
import { cn } from "@/lib/utils";

export function ColorSwatchPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger
        className="h-7 w-7 shrink-0 rounded-full border border-border"
        style={{ backgroundColor: value }}
        aria-label="Escolher cor"
      />
      <PopoverContent className="w-auto p-2">
        <div className="grid grid-cols-5 gap-1.5">
          {COLOR_PALETTE.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onChange(color)}
              className={cn(
                "h-6 w-6 rounded-full border border-border",
                value === color && "ring-2 ring-ring ring-offset-2 ring-offset-popover",
              )}
              style={{ backgroundColor: color }}
              aria-label={color}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
