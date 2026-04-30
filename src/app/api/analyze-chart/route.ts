import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ANALYST_SYSTEM_PROMPT, buildUserPrompt } from "@/lib/chart-analyst-prompt";

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType, section, extraContext } = await req.json();

    if (!imageBase64 || !section) {
      return NextResponse.json({ error: "imageBase64 e section são obrigatórios" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY não configurada" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

    const userPrompt = buildUserPrompt(section as "agressores" | "heatmap", extraContext);

    const result = await model.generateContent([
      { text: ANALYST_SYSTEM_PROMPT },
      {
        inlineData: {
          mimeType: mimeType || "image/png",
          data: imageBase64,
        },
      },
      { text: userPrompt },
    ]);

    const rawText = result.response.text().trim();

    // Tenta parsear o JSON retornado pelo modelo
    let parsed: { opcao1: string; opcao2: string };
    try {
      // Remove possíveis backticks de markdown
      const clean = rawText.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      // Se não vier JSON, retorna o texto como opcao1
      parsed = {
        opcao1: rawText,
        opcao2: "Não foi possível gerar uma segunda opção. Tente regenerar.",
      };
    }

    return NextResponse.json({ success: true, ...parsed });
  } catch (err) {
    console.error("[analyze-chart] Erro:", err);
    return NextResponse.json(
      { error: "Erro ao analisar gráfico. Verifique a chave GEMINI_API_KEY." },
      { status: 500 }
    );
  }
}
