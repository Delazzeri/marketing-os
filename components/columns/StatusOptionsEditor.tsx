"use client";

import { useState } from "react";
import { COLOR_PALETTE } from "@/lib/column-types/color-palette";
import { ColorSwatchPicker } from "@/components/columns/ColorSwatchPicker";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

// Shared editor for every option-based column type (status/format/select):
// a list of { label, color } entries, written to a hidden "statusOptions"
// input for CreateColumnForm to submit. The field name predates the
// generalization but stays "statusOptions" since server-side parsing
// (lib/actions/columns.ts, lib/validation/columns.ts) already keys on it.
interface LabeledOption {
  label: string;
  color: string;
}

export function StatusOptionsEditor() {
  const [options, setOptions] = useState<LabeledOption[]>([]);

  function addOption() {
    const color = COLOR_PALETTE[options.length % COLOR_PALETTE.length];
    setOptions([...options, { label: "", color }]);
  }

  function updateLabel(index: number, label: string) {
    setOptions(options.map((option, i) => (i === index ? { ...option, label } : option)));
  }

  function updateColor(index: number, color: string) {
    setOptions(options.map((option, i) => (i === index ? { ...option, color } : option)));
  }

  function removeOption(index: number) {
    setOptions(options.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name="statusOptions" value={JSON.stringify(options)} />
      {options.map((option, index) => (
        <div key={index} className="flex items-center gap-2">
          <ColorSwatchPicker value={option.color} onChange={(color) => updateColor(index, color)} />
          <Input
            value={option.label}
            onChange={(event) => updateLabel(index, event.target.value)}
            placeholder="Nome da opção"
            className="max-w-xs"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => removeOption(index)}
            className="text-muted-foreground hover:text-destructive"
          >
            <X />
          </Button>
        </div>
      ))}
      <Button type="button" variant="link" size="sm" onClick={addOption} className="self-start px-0">
        <Plus />
        opção
      </Button>
    </div>
  );
}
