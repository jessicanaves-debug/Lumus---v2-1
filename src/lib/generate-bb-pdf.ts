import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface ReportData {
  cliente: string;
  periodo: string;
  tipoPeriodo: "Semanal" | "Quinzenal";
  numeroDias: string;
  // Seção 1
  identificados: string;
  inativos: string;
  ocorrencias: string;
  notificados: string;
  eliminados: string;
  notificacoesEnviadas: string;
  textoIntro: string;
  // Seção 2
  novosAgressores: string;
  totalAgressores: string;
  textoAgressores: string;
  imagemAgressores?: string; // base64
  // Seção 3
  textoHeatmap: string;
  topAgressores: { dominio: string; score: string }[];
  imagemHeatmap?: string; // base64
  // Seção 4
  acoesContencao: { dominio: string; status: string }[];
  // Seção 5
  casosStandby: { agressor: string; status: string; proximaAcao: string }[];
  // Seção 6
  aguardandoAprovacao: string;
  // Seção 7
  resolvidos: string;
}

const NAVY = "#0D3349";
const TEAL = "#0E7C7B";
const GREEN = "#10B981";
const WHITE = "#FFFFFF";
const LIGHT_BG = "#F0F7FA";
const TEXT_DARK = "#1a2e3a";
const MUTED = "#7BA8C0";

export async function generateBbPdf(data: ReportData): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const margin = 16;
  const contentW = pageW - margin * 2;
  let y = 0;

  // ── HEADER ──────────────────────────────────────────────────────────────
  doc.setFillColor(NAVY);
  doc.rect(0, 0, pageW, 40, "F");

  doc.setTextColor(WHITE);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("LUMUS", margin, 17);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor("#7BA8C0");
  doc.text("by Branddi Monitor", margin, 24);

  doc.setTextColor(WHITE);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(`Relatório Brand Bidding — ${data.tipoPeriodo}`, margin, 34);

  // Info header direita
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor("#7BA8C0");
  doc.text(`Cliente: ${data.cliente}`, pageW - margin, 24, { align: "right" });
  doc.text(`Período: ${data.periodo}`, pageW - margin, 30, { align: "right" });
  doc.text(`${data.numeroDias} dias monitorados`, pageW - margin, 36, { align: "right" });

  y = 48;

  // ── SEÇÃO 1 — MÉTRICAS ───────────────────────────────────────────────────
  sectionTitle(doc, "1. Métricas do Período", y, margin, contentW);
  y += 10;

  // Texto intro
  if (data.textoIntro) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(TEXT_DARK);
    const lines = doc.splitTextToSize(data.textoIntro, contentW);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 4;
  }

  // Big numbers 2x3
  const metrics = [
    { label: "Identificados", value: data.identificados },
    { label: "Inativos", value: data.inativos },
    { label: "Ocorrências", value: data.ocorrencias },
    { label: "Notificados", value: data.notificados },
    { label: "Eliminados", value: data.eliminados },
    { label: "Notificações Enviadas", value: data.notificacoesEnviadas },
  ];

  const colW = contentW / 3;
  const rowH = 18;
  for (let i = 0; i < metrics.length; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = margin + col * colW;
    const my = y + row * (rowH + 4);

    doc.setFillColor(LIGHT_BG);
    doc.roundedRect(x, my, colW - 2, rowH, 3, 3, "F");

    doc.setTextColor(NAVY);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(metrics[i].value || "—", x + colW / 2 - 1, my + 10, { align: "center" });

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(MUTED);
    doc.text(metrics[i].label.toUpperCase(), x + colW / 2 - 1, my + 15.5, { align: "center" });
  }
  y += 2 * (rowH + 4) + 10;

  // ── SEÇÃO 2 — AGRESSORES ─────────────────────────────────────────────────
  checkPageBreak(doc, y, 40);
  sectionTitle(doc, "2. Agressores Identificados", y, margin, contentW);
  y += 10;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(TEXT_DARK);

  const agInfo = `Novos: ${data.novosAgressores || "—"}   |   Total: ${data.totalAgressores || "—"}`;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(TEAL);
  doc.text(agInfo, margin, y);
  y += 7;

  if (data.textoAgressores) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(TEXT_DARK);
    const lines = doc.splitTextToSize(data.textoAgressores, contentW);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 4;
  }

  if (data.imagemAgressores) {
    try {
      const imgH = 50;
      doc.addImage(data.imagemAgressores, "PNG", margin, y, contentW, imgH);
      y += imgH + 6;
    } catch { /* ignora erro de imagem */ }
  }

  // ── SEÇÃO 3 — HEATMAP ────────────────────────────────────────────────────
  checkPageBreak(doc, y, 40);
  sectionTitle(doc, "3. Análise de Ofensores (Heatmap)", y, margin, contentW);
  y += 10;

  if (data.textoHeatmap) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(TEXT_DARK);
    const lines = doc.splitTextToSize(data.textoHeatmap, contentW);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 4;
  }

  if (data.topAgressores && data.topAgressores.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["#", "Domínio Agressor", "Score"]],
      body: data.topAgressores.map((a, i) => [i + 1, a.dominio, a.score]),
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: "bold" },
      alternateRowStyles: { fillColor: LIGHT_BG },
      columnStyles: { 0: { cellWidth: 10 }, 2: { cellWidth: 20, halign: "center" } },
    });
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  }

  if (data.imagemHeatmap) {
    checkPageBreak(doc, y, 55);
    try {
      const imgH = 50;
      doc.addImage(data.imagemHeatmap, "PNG", margin, y, contentW, imgH);
      y += imgH + 6;
    } catch { /* ignora */ }
  }

  // ── SEÇÃO 4 — AÇÕES DE CONTENÇÃO ─────────────────────────────────────────
  if (data.acoesContencao && data.acoesContencao.length > 0) {
    checkPageBreak(doc, y, 40);
    sectionTitle(doc, "4. Status das Ações de Contenção", y, margin, contentW);
    y += 10;

    autoTable(doc, {
      startY: y,
      head: [["Domínio", "Status"]],
      body: data.acoesContencao.map((a) => [a.dominio, a.status]),
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: TEAL, textColor: WHITE, fontStyle: "bold" },
      alternateRowStyles: { fillColor: LIGHT_BG },
    });
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  }

  // ── SEÇÃO 5 — STANDBY ────────────────────────────────────────────────────
  if (data.casosStandby && data.casosStandby.length > 0) {
    checkPageBreak(doc, y, 40);
    sectionTitle(doc, "5. Casos em Standby", y, margin, contentW);
    y += 10;

    autoTable(doc, {
      startY: y,
      head: [["Agressor", "Status", "Próxima Ação"]],
      body: data.casosStandby.map((c) => [c.agressor, c.status, c.proximaAcao]),
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: "#164460", textColor: WHITE, fontStyle: "bold" },
      alternateRowStyles: { fillColor: LIGHT_BG },
    });
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  }

  // ── SEÇÃO 6 — AGUARDANDO APROVAÇÃO ───────────────────────────────────────
  if (data.aguardandoAprovacao?.trim()) {
    checkPageBreak(doc, y, 30);
    sectionTitle(doc, "6. Aguardando Aprovação do Cliente", y, margin, contentW);
    y += 10;
    const items = data.aguardandoAprovacao.trim().split("\n").filter(Boolean);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(TEXT_DARK);
    for (const item of items) {
      doc.setFillColor(LIGHT_BG);
      doc.roundedRect(margin, y - 3, contentW, 7, 2, 2, "F");
      doc.text(`• ${item.trim()}`, margin + 4, y + 1.5);
      y += 9;
    }
    y += 4;
  }

  // ── SEÇÃO 7 — RESOLVIDOS ─────────────────────────────────────────────────
  if (data.resolvidos?.trim()) {
    checkPageBreak(doc, y, 30);
    sectionTitle(doc, "7. Resolvidos no Período", y, margin, contentW);
    y += 10;
    const items = data.resolvidos.trim().split("\n").filter(Boolean);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(TEXT_DARK);
    for (const item of items) {
      doc.setFillColor("#ECFDF5");
      doc.roundedRect(margin, y - 3, contentW, 7, 2, 2, "F");
      doc.setTextColor(GREEN);
      doc.text("✓", margin + 3, y + 1.5);
      doc.setTextColor(TEXT_DARK);
      doc.text(item.trim(), margin + 9, y + 1.5);
      y += 9;
    }
  }

  // ── FOOTER em todas as páginas ───────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(NAVY);
    doc.rect(0, 285, pageW, 12, "F");
    doc.setFontSize(7);
    doc.setTextColor(MUTED);
    doc.setFont("helvetica", "normal");
    doc.text("Lumus by Branddi Monitor — Confidencial", margin, 292);
    doc.text(`Página ${i} de ${totalPages}`, pageW - margin, 292, { align: "right" });
  }

  doc.save(`relatorio-brandbidding-${data.cliente.replace(/\s+/g, "-").toLowerCase()}-${data.periodo.replace(/\s+/g, "")}.pdf`);
}

// ── Helpers ───────────────────────────────────────────────────────────────
function sectionTitle(doc: jsPDF, title: string, y: number, margin: number, w: number) {
  doc.setFillColor("#0D3349");
  doc.rect(margin, y, w, 8, "F");
  doc.setFillColor("#0E7C7B");
  doc.rect(margin, y, 3, 8, "F");
  doc.setTextColor("#FFFFFF");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(title, margin + 7, y + 5.5);
}

function checkPageBreak(doc: jsPDF, y: number, needed: number) {
  if (y + needed > 275) {
    doc.addPage();
    return 16;
  }
  return y;
}
