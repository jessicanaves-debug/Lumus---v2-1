"use client";

import { useRef, useCallback } from "react";
import { ImageIcon, X, Clipboard, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value?: string; // base64 preview URL (data:image/...)
  onChange: (base64: string, mimeType: string) => void;
  onClear: () => void;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function ImageUpload({ value, onChange, onClear, label, className, disabled }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const base64 = result.split(",")[1];
        onChange(base64, file.type);
      };
      reader.readAsDataURL(file);
    },
    [onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile, disabled]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      if (disabled) return;
      const items = Array.from(e.clipboardData.items);
      const imageItem = items.find((item) => item.type.startsWith("image/"));
      if (imageItem) {
        const file = imageItem.getAsFile();
        if (file) processFile(file);
      }
    },
    [processFile, disabled]
  );

  const handlePasteButton = useCallback(async () => {
    if (disabled) return;
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        const imageType = item.types.find((t) => t.startsWith("image/"));
        if (imageType) {
          const blob = await item.getType(imageType);
          const file = new File([blob], "paste.png", { type: imageType });
          processFile(file);
          return;
        }
      }
    } catch {
      // fallback: foca na área e instrui Ctrl+V
      inputRef.current?.focus();
    }
  }, [processFile, disabled]);

  if (value) {
    return (
      <div className={cn("relative rounded-xl overflow-hidden group", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`data:image/png;base64,${value}`}
          alt="Preview"
          className="w-full object-contain max-h-64 rounded-xl"
          style={{ background: "var(--navy)" }}
        />
        <button
          onClick={onClear}
          disabled={disabled}
          className="absolute top-2 right-2 p-1.5 rounded-full text-white transition-opacity"
          style={{ background: "rgba(13,51,73,0.85)" }}
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative rounded-xl border-2 border-dashed transition-colors cursor-pointer",
        disabled ? "opacity-50 cursor-not-allowed" : "hover:border-teal-500/60",
        className
      )}
      style={{ borderColor: "var(--border)", background: "var(--card)" }}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onPaste={handlePaste}
      tabIndex={0}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInput}
        disabled={disabled}
      />
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center gap-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: "var(--navy-light)" }}
        >
          <ImageIcon size={20} style={{ color: "var(--teal-light)" }} />
        </div>
        <div>
          <p className="text-sm font-medium text-white/80">
            {label || "Clique, arraste ou cole uma imagem"}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
            PNG, JPG, WEBP aceitos
          </p>
        </div>
        {/* Botões de ação */}
        <div className="flex gap-2 mt-1">
          <button
            type="button"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled) inputRef.current?.click();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{ background: "var(--navy-light)", color: "var(--text)" }}
          >
            <Upload size={12} />
            Upload
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              handlePasteButton();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{ background: "var(--navy-light)", color: "var(--text)" }}
          >
            <Clipboard size={12} />
            Colar (Ctrl+V)
          </button>
        </div>
      </div>
    </div>
  );
}
