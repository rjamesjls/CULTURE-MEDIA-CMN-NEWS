"use server";

import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function getKnowledgeContext(lang) {
  try {
    let context = "";
    const { data: rules } = await supabase.from('knowledge_brain').select('*').eq('is_active', true);
    if (rules && rules.length > 0) {
      context += "\n[RÈGLES ÉDITORIALES ABSOLUES À RESPECTER (TRÈS IMPORTANT)]\n";
      rules.forEach(r => context += `- ${r.title}: ${r.content}\n`);
    }

    if (lang === 'bsh' || lang === 'all') {
      const { data: dict } = await supabase.from('linguistic_dictionary').select('*').eq('is_active', true).eq('language', 'bsh');
      if (dict && dict.length > 0) {
        context += "\n[DICTIONNAIRE LINGUISTIQUE (BUSHINENGUÉ)]\nPrivilégie toujours ces termes :\n";
        dict.forEach(d => context += `- Français "${d.source_term}" = "${d.translated_term}" (${d.context || ''})\n`);
      }
    }
    return context;
  } catch (err) {
    console.error("Knowledge Brain fetch error:", err);
    return "";
  }
}

export async function saveTikTokState(articleId, state) {
  try {
    const { error } = await supabase
      .from("articles")
      .update({ tiktok_state: state })
      .eq("id", articleId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("Erreur lors de la sauvegarde de l'état TikTok:", err);
    return { success: false, error: err.message };
  }
}

export async function generateCaption(article) {
  try {
    const aiKey = process.env.GEMINI_API_KEY;
    if (!aiKey) throw new Error("Clé API IA manquante.");

    const genAI = new GoogleGenerativeAI(aiKey);
    const knowledgeContext = await getKnowledgeContext('all');

    const prompt = `Génère une description/légende courte et percutante pour une vidéo TikTok basée sur l'article suivant.
Le ton doit être dynamique, fait pour retenir l'attention (Hook), et inciter au commentaire.
Inclus quelques émojis pertinents et 3 à 5 hashtags viraux (dont #Guyane, #CultureMediaNews).
Ne fais pas de séparation français/bushinengé trop longue, reste très concis car c'est pour TikTok.

Voici l'article :
Titre : ${article.title}
Contenu : ${article.content}

${knowledgeContext}`;

    const modelsToTry = ['gemini-1.5-flash-latest', 'gemini-flash-latest'];
    let lastError;

    for (const modelName of modelsToTry) {
      try {
        const currentModel = genAI.getGenerativeModel({ model: modelName });
        const result = await currentModel.generateContent(prompt);
        const text = result.response.text();
        return { success: true, caption: text.trim() };
      } catch (err) {
        lastError = err;
        console.error(`Erreur avec ${modelName}:`, err.message);
        if (!err.message.includes("503") && !err.message.includes("429") && !err.message.includes("404")) {
          throw err;
        }
      }
    }
    throw lastError;
  } catch (err) {
    console.error("Erreur génération de légende TikTok:", err);
    return { success: false, error: err.message };
  }
}
