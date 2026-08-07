'use server';

import { createClient } from '@/utils/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateFacebookPost(articleId, instructions = "") {
  if (!process.env.GEMINI_API_KEY) {
    return { success: false, error: 'Clé API Gemini non configurée.' };
  }

  const supabase = await createClient();

  const { data: article, error: articleError } = await supabase
    .from('articles')
    .select('*')
    .eq('id', articleId)
    .single();

  if (articleError || !article) {
    return { success: false, error: 'Article introuvable.' };
  }

  const { data: rules } = await supabase
    .from('knowledge_brain')
    .select('*')
    .eq('is_active', true);

  const rulesContext = rules?.map(r => `- ${r.name}: ${r.content}`).join('\n') || 'Aucune règle spécifique.';

  const prompt = `Tu es un Community Manager expert pour "Culture Média CMN NEWS".
Ta mission est de créer un Post FACEBOOK engageant basé sur l'article ci-dessous.

Voici les règles éditoriales (Knowledge Brain) que tu DOIS ABSOLUMENT respecter :
${rulesContext}

CONTRAINTES POUR FACEBOOK :
- Le ton doit inciter à la discussion et au partage.
- Commence par une accroche forte ou une question posée à la communauté.
- Fais un résumé concis de l'article (2-3 phrases).
- Inclus 3-4 hashtags pertinents à la fin.
- Indique [LIEN ICI] à la fin pour que le CM sache où coller le lien de l'article.

L'ARTICLE :
Titre : ${article.title}
Description : ${article.description}
Contenu :
${article.content}

${instructions ? `\nINSTRUCTIONS SPÉCIFIQUES POUR CETTE VERSION :\n${instructions}\n` : ''}
Génère UNIQUEMENT le texte du post Facebook.`;

  try {
    const modelsToTry = ['gemini-1.5-flash-latest', 'gemini-flash-latest'];
    let lastError;
    
    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return { success: true, data: response.text().trim(), article };
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
    console.error("Erreur Gemini (Facebook):", error);
    return { success: false, error: "Impossible de générer le post Facebook via l'IA: " + error.message };
  }
}
