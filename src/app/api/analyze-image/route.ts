import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const image = formData.get("image") as File | null;
    const clientName = formData.get("clientName") as string | null;

    if (!image) {
      return NextResponse.json({ error: "Imagem não enviada" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY não configurada" }, { status: 500 });
    }

    const imageBytes = await image.arrayBuffer();
    const base64 = Buffer.from(imageBytes).toString("base64");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

    const prompt = `Você é um especialista em Brand Bidding. Analise este dashboard de monitoramento de marca${clientName ? ` do cliente ${clientName}` : ""} e extraia as seguintes informações em JSON:
{
  "identificados": "número",
  "inativos": "número",
  "ocorrencias": "número",
  "notificados": "número",
  "eliminados": "número",
  "notificacoesEnviadas": "número",
  "novosAgressores": "número",
  "totalAgressores": "número",
  "tipoPeriodo": "Semanal ou Quinzenal",
  "periodo": "ex: 01 Mar - 14 Mar",
  "numeroDias": "número de dias"
}
Se um campo não for visível, use "—". Retorne APENAS o JSON, sem markdown.`;

    const result = await model.generateContent([
      { inlineData: { mimeType: image.type, data: base64 } },
      { text: prompt },
    ]);

    const rawText = result.response.text().trim().replace(/```json|```/g, "").trim();

    try {
      const data = JSON.parse(rawText);
      return NextResponse.json({ success: true, data });
    } catch {
      return NextResponse.json({ success: true, data: {}, raw: rawText });
    }
  } catch (err) {
    console.error("[analyze-image] Erro:", err);
    return NextResponse.json({ error: "Erro ao processar imagem" }, { status: 500 });
  }
}
