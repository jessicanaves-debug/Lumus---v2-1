import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const PIPEFY_ENDPOINT = "https://api.pipefy.com/graphql";

interface PipefyCard {
  title: string;
  current_phase?: { name: string };
  labels?: { name: string }[];
  comments?: { text: string; created_at: string; author?: { name: string } }[];
  phases_history?: { phase: { name: string }; firstTimeIn: string }[];
  fields?: { name: string; value: string }[];
}

async function fetchPipefyCard(cardId: string, token: string): Promise<PipefyCard> {
  const query = `
    query GetCard($id: ID!) {
      card(id: $id) {
        title
        current_phase { name }
        labels { name }
        comments { text created_at author { name } }
        phases_history { phase { name } firstTimeIn }
        fields { name value }
      }
    }
  `;

  const res = await fetch(PIPEFY_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables: { id: cardId } }),
  });

  if (!res.ok) throw new Error(`Pipefy retornou status ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0]?.message || "Erro no Pipefy");
  return json.data.card;
}

function extractCardId(input: string): string {
  if (/^\d+$/.test(input.trim())) return input.trim();
  const match = input.match(/\/cards\/(\d+)/);
  if (match) return match[1];
  throw new Error("URL ou ID do card inválido");
}

export async function POST(req: NextRequest) {
  try {
    const { cardUrl, pipefyToken } = await req.json();

    if (!cardUrl || !pipefyToken) {
      return NextResponse.json({ error: "cardUrl e pipefyToken são obrigatórios" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY não configurada" }, { status: 500 });
    }

    const cardId = extractCardId(cardUrl);
    const card = await fetchPipefyCard(cardId, pipefyToken);

    const contexto = `
Título do card: ${card.title}
Fase atual: ${card.current_phase?.name || "—"}
Etiquetas: ${card.labels?.map((l) => l.name).join(", ") || "nenhuma"}
Campos: ${card.fields?.map((f) => `${f.name}: ${f.value}`).join(" | ") || "—"}
Histórico de fases: ${card.phases_history?.map((h) => `${h.phase.name} (${h.firstTimeIn})`).join(" → ") || "—"}
Comentários (${card.comments?.length || 0}):
${card.comments?.slice(-10).map((c) => `[${c.created_at}] ${c.author?.name || "?"}: ${c.text}`).join("\n") || "sem comentários"}
    `.trim();

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

    const prompt = `Você é um analista de Brand Bidding da Branddi Monitor. Com base nos dados do card do Pipefy abaixo, gere um resumo estruturado da tratativa em JSON:

${contexto}

Retorne APENAS este JSON (sem markdown):
{
  "nomeAgressor": "nome do domínio/empresa agressor",
  "etiquetaTopLeilao": true ou false,
  "numeroNotificacoes": "número ou estimativa",
  "ultimaComunicacao": "resumo da última comunicação relevante (máx 100 chars)",
  "houveRetorno": true ou false,
  "observacao": "resumo objetivo do status atual da tratativa (máx 200 chars)"
}`;

    const result = await model.generateContent(prompt);
    const rawText = result.response.text().trim().replace(/```json|```/g, "").trim();

    let resumo;
    try {
      resumo = JSON.parse(rawText);
    } catch {
      resumo = { raw: rawText };
    }

    return NextResponse.json({ success: true, resumo, cardTitle: card.title });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[resumo-tratativa] Erro:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
