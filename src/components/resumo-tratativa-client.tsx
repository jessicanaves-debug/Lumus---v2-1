"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import {
  Loader2,
  ClipboardCopy,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Resumo {
  nomeAgressor: string;
  etiquetaTopLeilao: boolean;
  numeroNotificacoes: string;
  ultimaComunicacao: string;
  houveRetorno: boolean;
  observacao: string;
}

interface ResumoEntry {
  cardUrl: string;
  cardTitle: string;
  resumo: Resumo;
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn("rounded-xl p-5", className)}
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      {children}
    </div>
  );
}

function StatusBadge({ value, trueLabel = "Sim", falseLabel = "Não" }: { value: boolean; trueLabel?: string; falseLabel?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={
        value
          ? { background: "rgba(16,185,129,0.15)", color: "#34D399" }
          : { background: "rgba(239,68,68,0.12)", color: "#F87171" }
      }
    >
      {value ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
      {value ? trueLabel : falseLabel}
    </span>
  );
}

export function ResumoTratativaClient() {
  const [cardUrl, setCardUrl] = useState("");
  const [pipefyToken, setPipefyToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [resumos, setResumos] = useState<ResumoEntry[]>([]);

  const handleSubmit = async () => {
    if (!cardUrl.trim() || !pipefyToken.trim()) {
      toast.error("Preencha a URL do card e o token do Pipefy.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/resumo-tratativa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardUrl: cardUrl.trim(), pipefyToken: pipefyToken.trim() }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Erro na API");

      setResumos((prev) => [
        { cardUrl: cardUrl.trim(), cardTitle: data.cardTitle, resumo: data.resumo },
        ...prev,
      ]);
      setCardUrl("");
      toast.success("Resumo gerado com sucesso!");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro desconhecido";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (entry: ResumoEntry) => {
    const lines = [
      `Card: ${entry.cardTitle || entry.cardUrl}`,
      `Agressor: ${entry.resumo.nomeAgressor}`,
      `Top Leilão: ${entry.resumo.etiquetaTopLeilao ? "Sim" : "Não"}`,
      `Notificações: ${entry.resumo.numeroNotificacoes}`,
      `Última comunicação: ${entry.resumo.ultimaComunicacao}`,
      `Houve retorno: ${entry.resumo.houveRetorno ? "Sim" : "Não"}`,
      `Observação: ${entry.resumo.observacao}`,
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    toast.success("Copiado!");
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Form */}
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--teal)" }}>
            <Search size={15} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Resumo de Tratativa</h2>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Cole a URL do card do Pipefy para gerar o resumo com IA
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--muted)" }}>
              URL ou ID do Card (Pipefy)
            </label>
            <input
              value={cardUrl}
              onChange={(e) => setCardUrl(e.target.value)}
              placeholder="https://app.pipefy.com/open-cards/123456 ou 123456"
              className="px-3 py-2.5 rounded-lg text-sm text-white outline-none"
              style={{ background: "var(--navy-light)", border: "1px solid var(--border)" }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--muted)" }}>
              Token de Acesso Pipefy (fica só neste navegador)
            </label>
            <input
              type="password"
              value={pipefyToken}
              onChange={(e) => setPipefyToken(e.target.value)}
              placeholder="eyJ0eXAiOiJKV1..."
              className="px-3 py-2.5 rounded-lg text-sm text-white outline-none"
              style={{ background: "var(--navy-light)", border: "1px solid var(--border)" }}
            />
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Não é salvo — você pode gerar em app.pipefy.com → Seu perfil → Tokens de acesso
            </p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--teal)" }}
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Analisando com IA...
              </>
            ) : (
              <>
                <Search size={15} />
                Gerar Resumo
              </>
            )}
          </button>
        </div>
      </Card>

      {/* Resultados */}
      {resumos.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">
              Resumos Gerados ({resumos.length})
            </h3>
            <button
              onClick={() => setResumos([])}
              className="text-xs text-white/40 hover:text-white/70 transition-colors flex items-center gap-1"
            >
              <Trash2 size={11} /> Limpar todos
            </button>
          </div>

          {resumos.map((entry, i) => (
            <div
              key={i}
              className="rounded-xl overflow-hidden animate-fade-in"
              style={{ border: "1px solid var(--border)" }}
            >
              {/* Card header */}
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ background: "var(--navy)", borderBottom: "1px solid var(--border)" }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "var(--teal-light)" }} />
                  <span className="text-sm font-medium text-white truncate">
                    {entry.cardTitle || `Card ${entry.cardUrl}`}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={entry.cardUrl.startsWith("http") ? entry.cardUrl : `https://app.pipefy.com/open-cards/${entry.cardUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-white/40 hover:text-white/70 transition-colors"
                  >
                    <ExternalLink size={13} />
                  </a>
                  <button
                    onClick={() => handleCopy(entry)}
                    className="text-white/40 hover:text-white/70 transition-colors"
                  >
                    <ClipboardCopy size={13} />
                  </button>
                  <button
                    onClick={() => setResumos(resumos.filter((_, idx) => idx !== i))}
                    className="text-white/30 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Card body */}
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ background: "var(--card)" }}>
                <div className="space-y-0.5">
                  <p className="text-xs" style={{ color: "var(--muted)" }}>Agressor</p>
                  <p className="text-sm font-semibold text-white">{entry.resumo.nomeAgressor || "—"}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs" style={{ color: "var(--muted)" }}>Etiqueta Top Leilão</p>
                  <StatusBadge value={entry.resumo.etiquetaTopLeilao} trueLabel="Top Leilão" falseLabel="Não marcado" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs" style={{ color: "var(--muted)" }}>Notificações</p>
                  <p className="text-sm text-white">{entry.resumo.numeroNotificacoes || "—"}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs" style={{ color: "var(--muted)" }}>Houve Retorno?</p>
                  <StatusBadge value={entry.resumo.houveRetorno} trueLabel="Retornou" falseLabel="Sem retorno" />
                </div>
                <div className="col-span-full space-y-0.5">
                  <p className="text-xs" style={{ color: "var(--muted)" }}>Última Comunicação</p>
                  <p className="text-sm text-white/80">{entry.resumo.ultimaComunicacao || "—"}</p>
                </div>
                <div className="col-span-full">
                  <div
                    className="rounded-lg px-3 py-2.5 flex items-start gap-2"
                    style={{ background: "rgba(14,124,123,0.08)", border: "1px solid rgba(14,124,123,0.2)" }}
                  >
                    <AlertCircle size={13} className="flex-shrink-0 mt-0.5" style={{ color: "var(--teal-light)" }} />
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text)" }}>
                      {entry.resumo.observacao || "Sem observações"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {resumos.length === 0 && !loading && (
        <div className="text-center py-12">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <Search size={22} style={{ color: "var(--muted)" }} />
          </div>
          <p className="text-sm font-medium text-white/60 mb-1">Nenhum resumo ainda</p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            Cole a URL de um card do Pipefy acima para gerar o primeiro resumo
          </p>
        </div>
      )}
    </div>
  );
}
