"use server";

import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function saveInstagramState(articleId, state) {
  try {
    const { error } = await supabase
      .from("articles")
      .update({ instagram_state: state })
      .eq("id", articleId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("Erreur lors de la sauvegarde de l'état Instagram:", err);
    return { success: false, error: err.message };
  }
}

export async function generateTitles(article, lang = 'fr') {
  try {
    const aiKey = process.env.GEMINI_API_KEY;
    if (!aiKey) throw new Error("Clé API IA manquante.");

    const genAI = new GoogleGenerativeAI(aiKey);
    const promptFr = `Génère 3 propositions de titres très courts, percutants et accrocheurs pour un post Instagram (style Breaking News ou Editorial). 
    Voici l'article d'origine :
    Titre : ${article.title}
    Contenu : ${article.content}
    
    Formatte la réponse UNIQUEMENT en tableau JSON valide de strings, sans markdown, sans autre texte. Exemple: ["Titre 1", "Titre 2", "Titre 3"]`;

    const promptBsh = `Génère 3 propositions de titres très courts, percutants et accrocheurs en langue Bushinengé (langues des Bushinengés de Guyane, par exemple Ndyuka, Aluku, Pamaka, ou Sranan Tongo) pour un post Instagram. 
    IMPORTANT : NE TRADUIS SURTOUT PAS EN CRÉOLE HAÏTIEN NI EN CRÉOLE ANTILLAIS. Utilise uniquement les dialectes Bushinengé de Guyane/Suriname.
    Voici l'article d'origine (en français) :
    Titre : ${article.title}
    Contenu : ${article.content}
    
    Formatte la réponse UNIQUEMENT en tableau JSON valide de strings, sans markdown, sans autre texte. Exemple: ["Titre Bsh 1", "Titre Bsh 2", "Titre Bsh 3"]`;

    const prompt = lang === 'fr' ? promptFr : promptBsh;

    const modelsToTry = ['gemini-1.5-flash-latest', 'gemini-flash-latest'];
    let lastError;

    for (const modelName of modelsToTry) {
      try {
        const currentModel = genAI.getGenerativeModel({ model: modelName });
        const result = await currentModel.generateContent(prompt);
        let text = result.response.text();
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const start = text.indexOf('[');
        const end = text.lastIndexOf(']');
        if (start !== -1 && end !== -1) {
            text = text.substring(start, end + 1);
        }
        const titles = JSON.parse(text);
        return { success: true, titles };
      } catch (err) {
        lastError = err;
        console.error(`Erreur avec ${modelName}:`, err.message);
        // On continue la boucle si c'est une erreur 404, 503 ou 429
        if (!err.message.includes("503") && !err.message.includes("429") && !err.message.includes("404")) {
          throw err;
        }
      }
    }
    throw lastError;
  } catch (err) {
    console.error("Erreur génération de titres:", err);
    return { success: false, error: err.message };
  }
}

export async function generateCaption(article) {
  try {
    const aiKey = process.env.GEMINI_API_KEY;
    if (!aiKey) throw new Error("Clé API IA manquante.");

    const genAI = new GoogleGenerativeAI(aiKey);
    const prompt = `Génère une légende Instagram complète pour l'article suivant.
La légende DOIT inclure DEUX versions du texte dans le même post :
1. D'abord le texte en Français (engageant, avec des emojis)
2. Ensuite un petit séparateur (ex: "---")
3. Ensuite la traduction du texte en langue Bushinengé (langues de Guyane/Suriname comme le Ndyuka, Aluku, Pamaka ou Sranan Tongo). IMPORTANT: PAS DE CRÉOLE HAÏTIEN, NI CRÉOLE ANTILLAIS.
4. À la fin, ajoute 5 à 10 hashtags pertinents en rapport avec l'article.

Voici l'article :
Titre : ${article.title}
Contenu : ${article.content}`;

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
    console.error("Erreur génération de légende:", err);
    return { success: false, error: err.message };
  }
}
