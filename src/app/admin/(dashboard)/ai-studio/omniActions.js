'use server';

import { createClient } from '@/utils/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getKnowledgeRules } from '../knowledge-brain/actions';
import { revalidatePath } from 'next/cache';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

export async function generateOmniArticle(conversationHistoryStr) {
  if (!apiKey) {
    return { success: false, error: 'Clé API Gemini manquante.' };
  }

  try {
    const rules = await getKnowledgeRules().catch(() => []);
    const rulesContext = rules?.map(r => `- [${r.category}] ${r.title}: ${r.content}`).join('\n') || 'Aucune règle spécifique.';

    const systemPrompt = `Tu es un rédacteur en chef IA de Culture Média. Ta mission est de rédiger un article journalistique complet à partir d'une brève instruction.
    
Règles éditoriales du média :
${rulesContext}

CONTRAINTE OBLIGATOIRE : Tu dois IMPÉRATIVEMENT fournir DEUX versions de ta réponse :
1. D'abord, génère la version en Français.
2. Ensuite, ajoute EXACTEMENT le séparateur suivant sur une nouvelle ligne : ===BUSHINENGUE===
3. Enfin, génère la même version traduite en Bushinengué (Nengee Tongo).

FORMAT DE SORTIE (pour chaque langue, de part et d'autre du séparateur) :
TITRE: [Titre accrocheur]
DESCRIPTION: [Description courte, max 2 phrases]
CONTENU:
[Texte de l'article avec des paragraphes bien structurés, au moins 300 mots]

Voici l'historique de la réflexion entre le journaliste et l'IA. Base-toi sur cette discussion pour rédiger l'article final parfait :
"${conversationHistoryStr}"`;

    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-pro-latest', 'gemini-flash-latest'];
    let lastError;
    let text = "";

    for (const modelName of modelsToTry) {
      try {
        const currentModel = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: { temperature: 0.7 }
        });
        
        const result = await currentModel.generateContent(systemPrompt);
        text = result.response.text();
        break; // Stop if success
      } catch (e) {
        lastError = e;
        if (e.message && e.message.includes('429')) {
          return { success: false, error: "Limite de requêtes atteinte (Quota API Google). Veuillez patienter quelques minutes." };
        }
      }
    }
    
    if (!text) {
      throw lastError || new Error("Tous les modèles ont échoué.");
    }

    const parts = text.split('===BUSHINENGUE===');
    const frenchPart = parts[0];
    
    const titleMatch = frenchPart.match(/TITRE:\s*(.+)/i);
    const descMatch = frenchPart.match(/DESCRIPTION:\s*(.+)/i);
    let contentStr = text.replace(/TITRE:\s*.+\n/gi, '').replace(/DESCRIPTION:\s*.+\n/gi, '').replace(/CONTENU:\s*/gi, '');

    const title = titleMatch ? titleMatch[1].trim() : "Article généré";
    const description = descMatch ? descMatch[1].trim() : "";
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now();

    const supabase = await createClient();
    const { data, error } = await supabase.from('articles').insert({
      title,
      description,
      content: contentStr.trim(),
      slug,
      pub_date: new Date().toISOString(),
      status: 'draft',
      author: 'AI Studio',
      category: 'AI Généré'
    }).select('id').single();

    if (error) {
      console.error("DB Insert error", error);
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/articles');
    return { success: true, articleId: data.id };

  } catch (error) {
    console.error('Omni generation error:', error);
    return { success: false, error: error.message };
  }
}
