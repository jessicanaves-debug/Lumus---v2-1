"use client";

import { Sparkles, RefreshCw, Check, Loader2, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalysisPickerProps {
  opcao1: string;
  opcao2: string;
  selected: 1 | 2;
  onSelect: (opt: 1 | 2) => void;
  onRegenerate: () => void;
  onEdit: (text: string) => void;
  loading?: boolean;
  editedText?: string;
}

export function AnalysisPicker({
  opcao1,
  opcao2,
  selected,
  onSelect,
  onRegenerate,
  onEdit,
  loading,
  editedText,
}: AnalysisPickerProps) {
  const currentText = editedText ?? (selected === 1 ? opcao1 : opcao2);
  const options: { id: 1 | 2; text: string; label: string }[] = [
    { id: 1, text: opcao1, label: "Opção 1 — Tendência estratégica" },
    { id: 2, text: opcao2, label: "Opção 2 — Concentração de risco" },
  ];

  if (loading) {
    return (
      <div
        className="rounded-xl p-4 flex items-center gap-3"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <Loader2 size={16} className="animate-spin flex-shrink-0" style={{ color: "var(--teal-light)" }} />
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Analisando gráfico com IA...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Seleção de opções */}
      <div className="flex items-center gap-2 flex-wrap">
        <Sparkles size={13} style={{ color: "var(--teal-light)" }} />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
          Análise IA
        </span>
        <div className="flex gap-1.5 ml-auto">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                selected === opt.id ? "text-white" : "text-white/50 hover:text-white/80"
              )}
              style={
                selected === opt.id
                  ? { background: "var(--teal)", border: "1px solid var(--teal)" }
                  : { background: "transparent", border: "1px solid var(--border)" }
              }
            >
              {selected === opt.id && <Check size={10} className="inline mr-1" />}
              Opção {opt.id}
            </button>
          ))}
          <button
            onClick={onRegenerate}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-white/50 hover:text-white/80 transition-all"
            style={{ border: "1px solid var(--border)" }}
            title="Gerar novas análises"
          >
            <RefreshCw size={10} />
            Regenerar
          </button>
        </div>
      </div>

      {/* Texto editável */}
      <div
        className="rounded-xl p-3"
        style={{ background: "rgba(14,124,123,0.08)", border: "1px solid rgba(14,124,123,0.25)" }}
      >
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <textarea
              value={currentText}
              onChange={(e) => onEdit(e.target.value)}
              rows={4}
              className="w-full bg-transparent text-sm resize-none outline-none"
              style={{ color: "var(--text)", lineHeight: "1.6" }}
              placeholder="Texto gerado pela IA aparecerá aqui..."
            />
          </div>
          <Edit2 size={12} className="mt-1 flex-shrink-0 opacity-40" />
        </div>
      </div>
    </div>
  );
}
