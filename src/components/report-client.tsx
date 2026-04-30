"use client";

import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  ClipboardCopy,
  Plus,
  Trash2,
  Shield,
  FileDown,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageUpload } from "@/components/image-upload";
import { AnalysisPicker } from "@/components/analysis-picker";
import { generateBbPdf, type ReportData } from "@/lib/generate-bb-pdf";

// ── Types ─────────────────────────────────────────────────────────────────────
interface AgressorItem { dominio: string; score: string }
interface ContencaoItem { dominio: string; status: string }
interface StandbyItem { agressor: string; status: string; proximaAcao: string }
interface AnalysisResult { opcao1: string; opcao2: string }
type Step = 1 | 2 | 3;

// ── Helper ────────────────────────────────────────────────────────────────────
function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div
        className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
        style={{ background: "var(--teal)" }}
      >
        {number}
      </div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
    </div>
  );
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

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--muted)" }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-lg px-3 py-2.5 text-sm text-white outline-none transition-all placeholder:text-white/25"
        style={{
          background: "var(--navy-light)",
          border: "1px solid var(--border)",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--teal)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--muted)" }}>
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="rounded-lg px-3 py-2.5 text-sm text-white outline-none transition-all placeholder:text-white/25 resize-none"
        style={{
          background: "var(--navy-light)",
          border: "1px solid var(--border)",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--teal)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
      />
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function ReportClient() {
  const [step, setStep] = useState<Step>(1);
  const [generating, setGenerating] = useState(false);

  // Identificação
  const [cliente, setCliente] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [tipoPeriodo, setTipoPeriodo] = useState<"Semanal" | "Quinzenal">("Quinzenal");
  const [numeroDias, setNumeroDias] = useState("");

  // Seção 1
  const [identificados, setIdentificados] = useState("");
  const [inativos, setInativos] = useState("");
  const [ocorrencias, setOcorrencias] = useState("");
  const [notificados, setNotificados] = useState("");
  const [eliminados, setEliminados] = useState("");
  const [notificacoesEnviadas, setNotificacoesEnviadas] = useState("");
  const [textoIntro, setTextoIntro] = useState("");

  // Seção 2 — Agressores
  const [novosAgressores, setNovosAgressores] = useState("");
  const [totalAgressores, setTotalAgressores] = useState("");
  const [textoAgressores, setTextoAgressores] = useState("");
  const [imagemAgressoresB64, setImagemAgressoresB64] = useState("");
  const [imagemAgressoresMime, setImagemAgressoresMime] = useState("image/png");
  const [analysisAgressores, setAnalysisAgressores] = useState<AnalysisResult | null>(null);
  const [selectedAgressores, setSelectedAgressores] = useState<1 | 2>(1);
  const [loadingAgressores, setLoadingAgressores] = useState(false);

  // Seção 3 — Heatmap
  const [textoHeatmap, setTextoHeatmap] = useState("");
  const [topAgressores, setTopAgressores] = useState<AgressorItem[]>([
    { dominio: "", score: "" },
  ]);
  const [imagemHeatmapB64, setImagemHeatmapB64] = useState("");
  const [imagemHeatmapMime, setImagemHeatmapMime] = useState("image/png");
  const [analysisHeatmap, setAnalysisHeatmap] = useState<AnalysisResult | null>(null);
  const [selectedHeatmap, setSelectedHeatmap] = useState<1 | 2>(1);
  const [loadingHeatmap, setLoadingHeatmap] = useState(false);

  // Seção 4
  const [acoesContencao, setAcoesContencao] = useState<ContencaoItem[]>([{ dominio: "", status: "" }]);

  // Seção 5
  const [casosStandby, setCasosStandby] = useState<StandbyItem[]>([
    { agressor: "", status: "", proximaAcao: "" },
  ]);

  // Seção 6 e 7
  const [aguardandoAprovacao, setAguardandoAprovacao] = useState("");
  const [resolvidos, setResolvidos] = useState("");

  // ── IA: Analisar gráfico ─────────────────────────────────────────────────
  const analyzeChart = useCallback(
    async (
      base64: string,
      mime: string,
      section: "agressores" | "heatmap",
      extraContext?: string
    ) => {
      try {
        const res = await fetch("/api/analyze-chart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, mimeType: mime, section, extraContext }),
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || "Erro na API");
        return { opcao1: data.opcao1 as string, opcao2: data.opcao2 as string };
      } catch (e) {
        throw e;
      }
    },
    []
  );

  const handleImagemAgressores = useCallback(
    async (b64: string, mime: string) => {
      setImagemAgressoresB64(b64);
      setImagemAgressoresMime(mime);
      setLoadingAgressores(true);
      try {
        const result = await analyzeChart(b64, mime, "agressores", `Novos: ${novosAgressores}, Total: ${totalAgressores}`);
        setAnalysisAgressores(result);
        setTextoAgressores(result.opcao1);
        setSelectedAgressores(1);
        toast.success("Análise de agressores gerada!");
      } catch (e) {
        toast.error("Erro ao analisar gráfico de agressores.");
        console.error(e);
      } finally {
        setLoadingAgressores(false);
      }
    },
    [analyzeChart, novosAgressores, totalAgressores]
  );

  const handleImagemHeatmap = useCallback(
    async (b64: string, mime: string) => {
      setImagemHeatmapB64(b64);
      setImagemHeatmapMime(mime);
      setLoadingHeatmap(true);
      try {
        const result = await analyzeChart(b64, mime, "heatmap");
        setAnalysisHeatmap(result);
        setTextoHeatmap(result.opcao1);
        setSelectedHeatmap(1);
        toast.success("Análise do heatmap gerada!");
      } catch (e) {
        toast.error("Erro ao analisar heatmap.");
        console.error(e);
      } finally {
        setLoadingHeatmap(false);
      }
    },
    [analyzeChart]
  );

  const regenerateAgressores = useCallback(async () => {
    if (!imagemAgressoresB64) return;
    setLoadingAgressores(true);
    try {
      const result = await analyzeChart(imagemAgressoresB64, imagemAgressoresMime, "agressores");
      setAnalysisAgressores(result);
      setTextoAgressores(result.opcao1);
      setSelectedAgressores(1);
      toast.success("Nova análise gerada!");
    } catch { toast.error("Erro ao regenerar."); }
    finally { setLoadingAgressores(false); }
  }, [analyzeChart, imagemAgressoresB64, imagemAgressoresMime]);

  const regenerateHeatmap = useCallback(async () => {
    if (!imagemHeatmapB64) return;
    setLoadingHeatmap(true);
    try {
      const result = await analyzeChart(imagemHeatmapB64, imagemHeatmapMime, "heatmap");
      setAnalysisHeatmap(result);
      setTextoHeatmap(result.opcao1);
      setSelectedHeatmap(1);
      toast.success("Nova análise gerada!");
    } catch { toast.error("Erro ao regenerar."); }
    finally { setLoadingHeatmap(false); }
  }, [analyzeChart, imagemHeatmapB64, imagemHeatmapMime]);

  // ── Texto consolidado do relatório ───────────────────────────────────────
  const generateReportText = () => {
    const lines: string[] = [];
    lines.push(`RELATÓRIO BRAND BIDDING — ${tipoPeriodo.toUpperCase()}`);
    lines.push(`Cliente: ${cliente} | Período: ${periodo} | ${numeroDias} dias`);
    lines.push("");
    lines.push("1. MÉTRICAS DO PERÍODO");
    lines.push(`Identificados: ${identificados}\tInativos: ${inativos}\tOcorrências: ${ocorrencias}`);
    lines.push(`Notificados: ${notificados}\tEliminados: ${eliminados}\tNotificações Enviadas: ${notificacoesEnviadas}`);
    if (textoIntro) { lines.push(""); lines.push(textoIntro); }
    lines.push("");
    lines.push("2. AGRESSORES IDENTIFICADOS");
    lines.push(`Novos: ${novosAgressores} | Total: ${totalAgressores}`);
    if (textoAgressores) lines.push(textoAgressores);
    lines.push("");
    lines.push("3. ANÁLISE DE OFENSORES (HEATMAP)");
    if (textoHeatmap) lines.push(textoHeatmap);
    if (topAgressores.some((a) => a.dominio)) {
      lines.push("Top Agressores:");
      topAgressores.forEach((a, i) => {
        if (a.dominio) lines.push(`  ${i + 1}. ${a.dominio} — Score: ${a.score}`);
      });
    }
    if (acoesContencao.some((a) => a.dominio)) {
      lines.push(""); lines.push("4. STATUS DAS AÇÕES DE CONTENÇÃO");
      acoesContencao.forEach((a) => { if (a.dominio) lines.push(`• ${a.dominio}: ${a.status}`); });
    }
    if (casosStandby.some((c) => c.agressor)) {
      lines.push(""); lines.push("5. CASOS EM STANDBY");
      casosStandby.forEach((c) => { if (c.agressor) lines.push(`• ${c.agressor} | ${c.status} | Próxima: ${c.proximaAcao}`); });
    }
    if (aguardandoAprovacao.trim()) {
      lines.push(""); lines.push("6. AGUARDANDO APROVAÇÃO DO CLIENTE");
      lines.push(aguardandoAprovacao);
    }
    if (resolvidos.trim()) {
      lines.push(""); lines.push("7. RESOLVIDOS NO PERÍODO");
      lines.push(resolvidos);
    }
    return lines.join("\n");
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generateReportText());
    toast.success("Texto copiado!");
  };

  const handleDownloadPdf = async () => {
    setGenerating(true);
    try {
      const reportData: ReportData = {
        cliente, periodo, tipoPeriodo, numeroDias,
        identificados, inativos, ocorrencias, notificados, eliminados, notificacoesEnviadas,
        textoIntro,
        novosAgressores, totalAgressores, textoAgressores,
        imagemAgressores: imagemAgressoresB64,
        textoHeatmap, topAgressores,
        imagemHeatmap: imagemHeatmapB64,
        acoesContencao, casosStandby, aguardandoAprovacao, resolvidos,
      };
      await generateBbPdf(reportData);
      toast.success("PDF baixado!");
    } catch (e) {
      toast.error("Erro ao gerar PDF.");
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  // ── Step indicator ───────────────────────────────────────────────────────
  const steps = [
    { num: 1, label: "Dados do Relatório" },
    { num: 2, label: "Seções Adicionais" },
    { num: 3, label: "Preview & Export" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2">
            <button
              onClick={() => setStep(s.num as Step)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                step === s.num ? "text-white" : "text-white/40 hover:text-white/70"
              )}
              style={step === s.num ? { background: "var(--navy-light)", border: "1px solid var(--teal)" } : {}}
            >
              <div
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold",
                  step > s.num ? "" : ""
                )}
                style={
                  step > s.num
                    ? { background: "var(--teal)", color: "white" }
                    : step === s.num
                    ? { background: "var(--teal)", color: "white" }
                    : { background: "var(--border)", color: "var(--muted)" }
                }
              >
                {step > s.num ? <Check size={10} /> : s.num}
              </div>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < steps.length - 1 && (
              <ChevronRight size={14} className="text-white/20 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* ── STEP 1 ─────────────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-5 animate-fade-in">
          {/* Identificação */}
          <Card>
            <SectionHeader number="i" title="Identificação do Relatório" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="col-span-2">
                <Input label="Nome do Cliente" value={cliente} onChange={setCliente} placeholder="ex: Loja X" />
              </div>
              <div className="col-span-2">
                <Input label="Período" value={periodo} onChange={setPeriodo} placeholder="ex: 01 Mar – 14 Mar" />
              </div>
              <div className="col-span-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                    Tipo de Período
                  </label>
                  <div className="flex gap-2">
                    {(["Semanal", "Quinzenal"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTipoPeriodo(t)}
                        className={cn(
                          "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all",
                          tipoPeriodo === t ? "text-white" : "text-white/40"
                        )}
                        style={
                          tipoPeriodo === t
                            ? { background: "var(--teal)", border: "1px solid var(--teal)" }
                            : { background: "var(--navy-light)", border: "1px solid var(--border)" }
                        }
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="col-span-2">
                <Input label="Nº de Dias" value={numeroDias} onChange={setNumeroDias} placeholder="ex: 14" type="number" />
              </div>
            </div>
          </Card>

          {/* Seção 1 — Métricas */}
          <Card>
            <SectionHeader number="1" title="Métricas do Período" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              {[
                { label: "Identificados", value: identificados, set: setIdentificados },
                { label: "Inativos", value: inativos, set: setInativos },
                { label: "Ocorrências", value: ocorrencias, set: setOcorrencias },
                { label: "Notificados", value: notificados, set: setNotificados },
                { label: "Eliminados", value: eliminados, set: setEliminados },
                { label: "Notificações Enviadas", value: notificacoesEnviadas, set: setNotificacoesEnviadas },
              ].map((m) => (
                <Input key={m.label} label={m.label} value={m.value} onChange={m.set} placeholder="0" type="number" />
              ))}
            </div>
            <TextArea label="Texto Introdutório" value={textoIntro} onChange={setTextoIntro} placeholder="Durante as últimas duas semanas..." rows={3} />
          </Card>

          {/* Seção 2 — Agressores */}
          <Card>
            <SectionHeader number="2" title="Agressores Identificados" />
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Input label="Novos Agressores" value={novosAgressores} onChange={setNovosAgressores} placeholder="0" type="number" />
              <Input label="Total de Agressores" value={totalAgressores} onChange={setTotalAgressores} placeholder="0" type="number" />
            </div>

            <div className="mb-4">
              <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "var(--muted)" }}>
                Gráfico de Agressores
              </p>
              <ImageUpload
                value={imagemAgressoresB64}
                onChange={handleImagemAgressores}
                onClear={() => { setImagemAgressoresB64(""); setAnalysisAgressores(null); setTextoAgressores(""); }}
                label="Cole ou arraste o gráfico de agressores — a IA analisa automaticamente"
                disabled={loadingAgressores}
              />
            </div>

            {analysisAgressores ? (
              <AnalysisPicker
                opcao1={analysisAgressores.opcao1}
                opcao2={analysisAgressores.opcao2}
                selected={selectedAgressores}
                onSelect={(opt) => { setSelectedAgressores(opt); setTextoAgressores(opt === 1 ? analysisAgressores.opcao1 : analysisAgressores.opcao2); }}
                onRegenerate={regenerateAgressores}
                onEdit={setTextoAgressores}
                loading={loadingAgressores}
                editedText={textoAgressores}
              />
            ) : loadingAgressores ? (
              <AnalysisPicker opcao1="" opcao2="" selected={1} onSelect={() => {}} onRegenerate={() => {}} onEdit={() => {}} loading />
            ) : (
              <TextArea label="Texto Introdutório dos Agressores (ou cole o gráfico para gerar com IA)" value={textoAgressores} onChange={setTextoAgressores} placeholder="Descreva os agressores identificados neste período..." rows={3} />
            )}
          </Card>

          {/* Seção 3 — Heatmap */}
          <Card>
            <SectionHeader number="3" title="Análise de Ofensores (Heatmap)" />

            <div className="mb-4">
              <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "var(--muted)" }}>
                Gráfico Heatmap
              </p>
              <ImageUpload
                value={imagemHeatmapB64}
                onChange={handleImagemHeatmap}
                onClear={() => { setImagemHeatmapB64(""); setAnalysisHeatmap(null); setTextoHeatmap(""); }}
                label="Cole ou arraste o heatmap — a IA analisa automaticamente"
                disabled={loadingHeatmap}
              />
            </div>

            {analysisHeatmap ? (
              <AnalysisPicker
                opcao1={analysisHeatmap.opcao1}
                opcao2={analysisHeatmap.opcao2}
                selected={selectedHeatmap}
                onSelect={(opt) => { setSelectedHeatmap(opt); setTextoHeatmap(opt === 1 ? analysisHeatmap.opcao1 : analysisHeatmap.opcao2); }}
                onRegenerate={regenerateHeatmap}
                onEdit={setTextoHeatmap}
                loading={loadingHeatmap}
                editedText={textoHeatmap}
              />
            ) : loadingHeatmap ? (
              <AnalysisPicker opcao1="" opcao2="" selected={1} onSelect={() => {}} onRegenerate={() => {}} onEdit={() => {}} loading />
            ) : (
              <TextArea label="Texto do Heatmap (ou cole o gráfico para gerar com IA)" value={textoHeatmap} onChange={setTextoHeatmap} placeholder="Os principais agressores do período..." rows={3} />
            )}

            <div className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                  Top Agressores (Score)
                </p>
                <button
                  onClick={() => setTopAgressores([...topAgressores, { dominio: "", score: "" }])}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors"
                  style={{ color: "var(--teal-light)", background: "rgba(14,124,123,0.1)" }}
                >
                  <Plus size={11} /> Adicionar
                </button>
              </div>
              <div className="space-y-2">
                {topAgressores.map((ag, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: "var(--navy-light)", color: "var(--muted)" }}
                    >
                      {i + 1}
                    </div>
                    <input
                      value={ag.dominio}
                      onChange={(e) => {
                        const updated = [...topAgressores];
                        updated[i].dominio = e.target.value;
                        setTopAgressores(updated);
                      }}
                      placeholder="dominio.com"
                      className="flex-1 px-3 py-2 rounded-lg text-sm text-white outline-none"
                      style={{ background: "var(--navy-light)", border: "1px solid var(--border)" }}
                    />
                    <input
                      value={ag.score}
                      onChange={(e) => {
                        const updated = [...topAgressores];
                        updated[i].score = e.target.value;
                        setTopAgressores(updated);
                      }}
                      placeholder="Score"
                      className="w-20 px-3 py-2 rounded-lg text-sm text-white outline-none text-center"
                      style={{ background: "var(--navy-light)", border: "1px solid var(--border)" }}
                    />
                    <button
                      onClick={() => setTopAgressores(topAgressores.filter((_, idx) => idx !== i))}
                      className="p-2 rounded-lg transition-colors text-white/30 hover:text-red-400"
                      style={{ background: "var(--navy-light)" }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "var(--teal)" }}
            >
              Próximo: Seções Adicionais <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2 ─────────────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-5 animate-fade-in">
          {/* Seção 4 — Contenção */}
          <Card>
            <SectionHeader number="4" title="Status das Ações de Contenção" />
            <div className="space-y-2 mb-3">
              {acoesContencao.map((ac, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={ac.dominio}
                    onChange={(e) => { const u = [...acoesContencao]; u[i].dominio = e.target.value; setAcoesContencao(u); }}
                    placeholder="dominio.com"
                    className="flex-1 px-3 py-2 rounded-lg text-sm text-white outline-none"
                    style={{ background: "var(--navy-light)", border: "1px solid var(--border)" }}
                  />
                  <input
                    value={ac.status}
                    onChange={(e) => { const u = [...acoesContencao]; u[i].status = e.target.value; setAcoesContencao(u); }}
                    placeholder="Status"
                    className="flex-1 px-3 py-2 rounded-lg text-sm text-white outline-none"
                    style={{ background: "var(--navy-light)", border: "1px solid var(--border)" }}
                  />
                  <button onClick={() => setAcoesContencao(acoesContencao.filter((_, idx) => idx !== i))} className="p-2 rounded-lg text-white/30 hover:text-red-400" style={{ background: "var(--navy-light)" }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => setAcoesContencao([...acoesContencao, { dominio: "", status: "" }])} className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg" style={{ color: "var(--teal-light)", background: "rgba(14,124,123,0.1)" }}>
              <Plus size={11} /> Adicionar
            </button>
          </Card>

          {/* Seção 5 — Standby */}
          <Card>
            <SectionHeader number="5" title="Casos em Standby" />
            <div className="space-y-2 mb-3">
              {casosStandby.map((cs, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <input value={cs.agressor} onChange={(e) => { const u = [...casosStandby]; u[i].agressor = e.target.value; setCasosStandby(u); }} placeholder="Agressor" className="px-3 py-2 rounded-lg text-sm text-white outline-none" style={{ background: "var(--navy-light)", border: "1px solid var(--border)" }} />
                    <input value={cs.status} onChange={(e) => { const u = [...casosStandby]; u[i].status = e.target.value; setCasosStandby(u); }} placeholder="Status" className="px-3 py-2 rounded-lg text-sm text-white outline-none" style={{ background: "var(--navy-light)", border: "1px solid var(--border)" }} />
                    <input value={cs.proximaAcao} onChange={(e) => { const u = [...casosStandby]; u[i].proximaAcao = e.target.value; setCasosStandby(u); }} placeholder="Próxima ação" className="px-3 py-2 rounded-lg text-sm text-white outline-none" style={{ background: "var(--navy-light)", border: "1px solid var(--border)" }} />
                  </div>
                  <button onClick={() => setCasosStandby(casosStandby.filter((_, idx) => idx !== i))} className="p-2 rounded-lg text-white/30 hover:text-red-400 mt-0.5" style={{ background: "var(--navy-light)" }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => setCasosStandby([...casosStandby, { agressor: "", status: "", proximaAcao: "" }])} className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg" style={{ color: "var(--teal-light)", background: "rgba(14,124,123,0.1)" }}>
              <Plus size={11} /> Adicionar
            </button>
          </Card>

          {/* Seção 6 */}
          <Card>
            <SectionHeader number="6" title="Aguardando Aprovação do Cliente" />
            <TextArea label="Um domínio por linha" value={aguardandoAprovacao} onChange={setAguardandoAprovacao} placeholder="dominio1.com&#10;dominio2.com" rows={4} />
          </Card>

          {/* Seção 7 */}
          <Card>
            <SectionHeader number="7" title="Resolvidos no Período" />
            <TextArea label="Um domínio por linha" value={resolvidos} onChange={setResolvidos} placeholder="dominio-resolvido.com&#10;outro.com" rows={4} />
          </Card>

          <div className="flex items-center justify-between">
            <button onClick={() => setStep(1)} className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-white/60 hover:text-white transition-colors">
              <ChevronLeft size={16} /> Voltar
            </button>
            <button onClick={() => setStep(3)} className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90" style={{ background: "var(--teal)" }}>
              Preview e Export <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3 — PREVIEW ────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-5 animate-fade-in">
          {/* Ações */}
          <div className="flex flex-wrap gap-3">
            <button onClick={handleCopyText} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90" style={{ background: "var(--navy-light)", border: "1px solid var(--border)" }}>
              <ClipboardCopy size={15} /> Copiar Texto
            </button>
            <button onClick={handleDownloadPdf} disabled={generating} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90" style={{ background: "var(--teal)" }}>
              {generating ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} />}
              Baixar PDF
            </button>
            <button onClick={() => setStep(1)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white transition-colors ml-auto">
              <ChevronLeft size={15} /> Editar
            </button>
          </div>

          {/* Preview visual */}
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            {/* Header preview */}
            <div className="px-6 py-5" style={{ background: "#0D3349" }}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Shield size={18} style={{ color: "#0E7C7B" }} />
                    <span className="text-white font-bold text-lg tracking-wide">LUMUS</span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(14,124,123,0.2)", color: "#14a8a6" }}>
                      by Branddi
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-white/80">
                    Relatório Brand Bidding — {tipoPeriodo}
                  </p>
                </div>
                <div className="text-right text-xs" style={{ color: "#7BA8C0" }}>
                  <p className="font-medium text-white/90">{cliente || "—"}</p>
                  <p>{periodo || "—"}</p>
                  <p>{numeroDias ? `${numeroDias} dias` : "—"}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6" style={{ background: "#F5F9FC" }}>
              {/* Métricas */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest mb-3 px-1" style={{ color: "#0D3349" }}>
                  1. Métricas do Período
                </h3>
                {textoIntro && <p className="text-xs text-gray-600 mb-3 leading-relaxed">{textoIntro}</p>}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { label: "Identificados", value: identificados },
                    { label: "Inativos", value: inativos },
                    { label: "Ocorrências", value: ocorrencias },
                    { label: "Notificados", value: notificados },
                    { label: "Eliminados", value: eliminados },
                    { label: "Notif. Enviadas", value: notificacoesEnviadas },
                  ].map((m) => (
                    <div key={m.label} className="bg-white rounded-lg p-2.5 text-center shadow-sm border border-blue-50">
                      <div className="text-lg font-bold" style={{ color: "#0D3349" }}>{m.value || "—"}</div>
                      <div className="text-xs" style={{ color: "#7BA8C0" }}>{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Agressores */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: "#0D3349" }}>
                    2. Agressores Identificados
                  </h3>
                  {imagemAgressoresB64 && (
                    <button
                      onClick={regenerateAgressores}
                      disabled={loadingAgressores}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors"
                      style={{ color: "#0E7C7B", background: "rgba(14,124,123,0.1)" }}
                    >
                      {loadingAgressores ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
                      Nova análise IA
                    </button>
                  )}
                </div>
                <div className="flex gap-3 mb-2">
                  <span className="text-xs font-semibold" style={{ color: "#0E7C7B" }}>Novos: {novosAgressores || "—"}</span>
                  <span className="text-xs text-gray-400">|</span>
                  <span className="text-xs font-semibold" style={{ color: "#0E7C7B" }}>Total: {totalAgressores || "—"}</span>
                </div>
                {textoAgressores && (
                  <p className="text-xs text-gray-600 leading-relaxed mb-2">
                    {analysisAgressores && <Sparkles size={10} className="inline mr-1 text-teal-500" />}
                    {textoAgressores}
                  </p>
                )}
                {imagemAgressoresB64 && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`data:image/png;base64,${imagemAgressoresB64}`} alt="Gráfico de Agressores" className="w-full rounded-lg mt-2 border border-gray-100" />
                )}
              </div>

              {/* Heatmap */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: "#0D3349" }}>
                    3. Análise de Ofensores (Heatmap)
                  </h3>
                  {imagemHeatmapB64 && (
                    <button
                      onClick={regenerateHeatmap}
                      disabled={loadingHeatmap}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors"
                      style={{ color: "#0E7C7B", background: "rgba(14,124,123,0.1)" }}
                    >
                      {loadingHeatmap ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
                      Nova análise IA
                    </button>
                  )}
                </div>
                {textoHeatmap && (
                  <p className="text-xs text-gray-600 leading-relaxed mb-2">
                    {analysisHeatmap && <Sparkles size={10} className="inline mr-1 text-teal-500" />}
                    {textoHeatmap}
                  </p>
                )}
                {topAgressores.some((a) => a.dominio) && (
                  <div className="mt-2 space-y-1">
                    {topAgressores.filter((a) => a.dominio).map((a, i) => (
                      <div key={i} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-100">
                        <span className="w-5 h-5 rounded text-xs font-bold flex items-center justify-center" style={{ background: "#0D3349", color: "white" }}>{i + 1}</span>
                        <span className="text-xs text-gray-700 flex-1">{a.dominio}</span>
                        <span className="text-xs font-semibold" style={{ color: "#0E7C7B" }}>Score: {a.score}</span>
                      </div>
                    ))}
                  </div>
                )}
                {imagemHeatmapB64 && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`data:image/png;base64,${imagemHeatmapB64}`} alt="Heatmap" className="w-full rounded-lg mt-2 border border-gray-100" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
