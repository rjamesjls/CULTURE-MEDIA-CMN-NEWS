'use server';

import { createClient } from '@/utils/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

import { getKnowledgeRules, getDictionaryTerms } from '../knowledge-brain/actions';

export async function translateArticle(frenchTitle, frenchDescription, frenchContent, targetLanguage = 'Bushinengué') {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('La clé API Gemini n\'est pas configurée.');
  }

  // 1. Fetch Knowledge Brain rules
  const rules = await getKnowledgeRules().catch(() => []);

  // 2. Fetch Linguistic Dictionary
  const dictionary = await getDictionaryTerms(targetLanguage).catch(() => []);

  // Format rules
  const rulesContext = rules?.map(r => `- [${r.category}] ${r.title}: ${r.content}`).join('\n') || 'Aucune règle spécifique.';
  
  // Format dictionary
  const dictContext = dictionary?.map(d => `- Le mot "${d.source_term}" se traduit par "${d.translated_term}" (Contexte: ${d.context || 'Aucun'})`).join('\n') || 'Aucun terme spécifique.';

  const prompt = `Tu es un journaliste et traducteur expert travaillant pour Culture Média CMN NEWS.
Ta mission est de traduire un article journalistique du Français vers le ${targetLanguage}.

Voici les règles éditoriales (Knowledge Brain) que tu DOIS ABSOLUMENT respecter :
${rulesContext}

Voici le dictionnaire local obligatoire :
${dictContext}

IMPORTANT : 
- Si un mot du texte français existe dans le dictionnaire local, tu DOIS utiliser sa traduction locale.
- Adapte le texte à la culture locale, ne fais pas de traduction littérale si une expression locale est plus appropriée.
- Le format de sortie doit être un objet JSON valide avec les clés "title", "description" et "content".
- Ne renvoie QUE du JSON, sans formatage markdown \`\`\`json.
- Le "content" doit conserver les balises HTML si elles sont présentes dans le texte original.

Texte à traduire :
---
TITRE: ${frenchTitle}
DESCRIPTION: ${frenchDescription || ''}
CONTENU:
${frenchContent}
---
`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();
    
    // Clean up potential markdown JSON formatting
    if (text.startsWith('```json')) {
      text = text.replace(/^```json\n/, '').replace(/\n```$/, '');
    }

    return JSON.parse(text);
  } catch (error) {
    console.error("Erreur de traduction:", error);
    throw new Error("Impossible de traduire l'article. Vérifiez les logs.");
  }
}
