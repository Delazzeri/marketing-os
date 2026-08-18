"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { avatarColorFor } from "@/lib/avatar-color";
import { Upload, X } from "lucide-react";

function initialsFor(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "?";
}

export function BoardIconPicker({
  boardId,
  boardName,
  logoUrl: rawLogoUrl,
  onChange,
}: {
  boardId: number;
  boardName: string;
  logoUrl: string | null;
  onChange: (logoUrl: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [uploading, startUploading] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const color = avatarColorFor(boardName);
  // icon used to store an emoji glyph before the upload picker replaced it;
  // guard against any leftover non-URL value so next/image never gets
  // handed something it can't construct a URL from.
  const logoUrl = rawLogoUrl?.startsWith("http") ? rawLogoUrl : null;

  function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);
    startUploading(async () => {
      const supabase = createClient();
      const path = `${boardId}-${Date.now()}.${file.name.split(".").pop() ?? "png"}`;
      const { error: uploadError } = await supabase.storage
        .from("board-icons")
        .upload(path, file, { upsert: false });

      if (uploadError) {
        setError("Falha ao enviar a imagem.");
        return;
      }

      const { data } = supabase.storage.from("board-icons").getPublicUrl(path);
      onChange(data.publicUrl);
      setOpen(false);
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-md text-[10px] font-semibold text-white"
        style={{ backgroundColor: logoUrl ? undefined : color }}
        aria-label="Trocar logo do quadro"
      >
        {logoUrl ? (
          <Image src={logoUrl} alt="" width={20} height={20} className="h-full w-full object-cover" />
        ) : (
          initialsFor(boardName)
        )}
      </PopoverTrigger>
      <PopoverContent className="w-56">
        <div className="flex flex-col gap-2">
          {logoUrl && (
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md">
                <Image src={logoUrl} alt="" width={40} height={40} className="h-full w-full object-cover" />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                }}
              >
                <X />
                Remover
              </Button>
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload />
            {uploading ? "Enviando..." : logoUrl ? "Trocar logo" : "Enviar logo"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelected}
          />
          {!logoUrl && (
            <p className="text-xs text-muted-foreground">Sem logo, mostramos a inicial do nome.</p>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      </PopoverContent>
    </Popover>
  );
}
