import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "Clé API Gemini manquante." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const { prompt } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Le prompt est requis." }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const modelsToTry = ['gemini-1.5-flash-latest', 'gemini-flash-latest', 'gemini-2.5-flash'];
    let lastError;

    for (const modelName of modelsToTry) {
      try {
        const currentModel = genAI.getGenerativeModel({ model: modelName });
        const result = await currentModel.generateContent(prompt);
        let text = result.response.text();
        
        text = text.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();

        return new Response(JSON.stringify({ hook: text, suggestions: [text] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      } catch (err) {
        lastError = err;
        console.error(`Erreur avec ${modelName}:`, err.message);
        if (!err.message.includes("503") && !err.message.includes("429") && !err.message.includes("404")) {
          throw err;
        }
      }
    }
    throw lastError;
  } catch (error) {
    console.error("AI Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
