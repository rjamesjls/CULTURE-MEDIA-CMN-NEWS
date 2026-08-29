'use server';

import { createClient } from '@/utils/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getKnowledgeRules } from '../../../knowledge-brain/actions';
import { revalidatePath } from 'next/cache';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

export async function getArticleSpinoffs(articleId) {
  const supabase = await createClient();
  const { data: article, error } = await supabase
    .from('articles')
    .select('id, title, description, content, spinoffs')
    .eq('id', articleId)
    .single();
  
  if (error || !article) {
    return { success: false, error: 'Article introuvable.' };
  }
  return { success: true, article, spinoffs: article.spinoffs || {} };
}

export async function saveSpinoffs(articleId, newSpinoffs) {
  const supabase = await createClient();
  
  // Get current spinoffs
  const { data: article } = await supabase
    .from('articles')
    .select('spinoffs')
    .eq('id', articleId)
    .single();
    
  const currentSpinoffs = article?.spinoffs || {};
  const updatedSpinoffs = { ...currentSpinoffs, ...newSpinoffs };
  
  const { error } = await supabase
    .from('articles')
    .update({ spinoffs: updatedSpinoffs })
    .eq('id', articleId);
    
  if (error) {
    return { success: false, error: error.message };
  }
  
  revalidatePath(`/admin/articles/${articleId}/spinoffs`);
  return { success: true, spinoffs: updatedSpinoffs };
}

export async function generateSpinoff(articleId, format, instructions = "") {
  if (!apiKey) {
    return { success: false, error: 'Clé API Gemini manquante.' };
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

  const rules = await getKnowledgeRules().catch(() => []);
  const rulesContext = rules?.map(r => `- [${r.category}] ${r.title}: ${r.content}`).join('\n') || 'Aucune règle spécifique.';

  let prompt = `Voici un article source :\nTitre : ${article.title}\nDescription : ${article.description || ''}\nContenu : ${article.content}\n\n`;
  prompt += `Règles éditoriales du média (à respecter absolument) :\n${rulesContext}\n\n`;
  
  prompt += `MISSION :\nTu es un journaliste et community manager expert. Ta mission est de générer UNIQUEMENT le format demandé ci-dessous basé sur cet article.\n\nFORMAT DEMANDÉ : `;

  switch (format) {
    case 'facebook':
      prompt += "Une publication Facebook engageante, avec des émojis pertinents, qui suscite la discussion. Inclure des hashtags à la fin. Ne pas inventer de lien, laisse [LIEN_ARTICLE].";
      break;
    case 'linkedin':
      prompt += "Une publication LinkedIn professionnelle, structurée, valorisant l'aspect business/pro/analyse de l'article. Paragraphes aérés, ton expert. Emojis modérés.";
      break;
    case 'instagram_post':
      prompt += "Une idée de post Instagram (texte de l'image + légende). Décris brièvement le visuel idéal, puis rédige la légende avec hashtags.";
      break;
    case 'instagram_caption':
      prompt += "Uniquement la légende Instagram. Accrocheuse, incitant au like et au partage. Liste de hashtags à la fin.";
      break;
    case 'tiktok_script':
      prompt += "Un script pour TikTok (1 minute max). Indique les actions visuelles entre crochets [Action: ...] et le texte parlé séparément. Le ton doit être dynamique et direct.";
      break;
    case 'reel_script':
      prompt += "Un script pour un Reel Instagram (rapide, dynamique, tendance). Sépare l'audio/voix-off du visuel suggéré.";
      break;
    case 'youtube_short':
      prompt += "Un script pour YouTube Short (punchy, focalisé sur la rétention de l'audience). Format : Hook (Accroche) -> Corps -> Call to action.";
      break;
    case 'radio_script':
      prompt += "Un script radio journalistique. Ton oral, informatif et sérieux. Indique les temps (ex: 30 secondes).";
      break;
    case 'podcast':
      prompt += "Une introduction et structure pour un épisode de podcast discutant de cet article. Suggère le titre de l'épisode, l'intro, 3 points à débattre, et une conclusion.";
      break;
    case 'newsletter':
      prompt += "Un encart pour une newsletter par e-mail. Titre accrocheur, texte court qui donne envie de cliquer pour lire la suite sur le site.";
      break;
    case 'push_notif':
      prompt += "Une notification Push mobile. Ultra-courte, percutante, max 100 caractères.";
      break;
    case 'sms':
      prompt += "Un SMS d'information (160 caractères max). Concis et clair, avec [LIEN].";
      break;
    case 'whatsapp':
      prompt += "Un message formaté pour WhatsApp (utilisant *gras*, _italique_ si besoin). Convivial, partageable, avec un peu d'émojis.";
      break;
    case 'short_version':
      prompt += "Une version résumée (brève) de l'article, environ 100 à 150 mots.";
      break;
    case 'medium_version':
      prompt += "Une version moyenne de l'article, environ 300 à 400 mots, allant à l'essentiel tout en gardant du contexte.";
      break;
    case 'long_version':
      prompt += "Une version longue et approfondie (si possible en extrapolant intelligemment le contexte sans inventer de fausses nouvelles), style grand reportage ou analyse.";
      break;
    case 'flash_info':
      prompt += "Un Flash Info (style 'Dernière minute' ou 'Breaking News'). Très direct, factuel, type dépêche AFP, 2 à 3 phrases.";
      break;
    case 'en_translation':
      prompt += "Une traduction complète et fidèle de l'article en Anglais, en respectant le ton journalistique et professionnel d'origine. Ne génère QUE le texte de l'article en anglais.";
      break;
    case 'es_translation':
      prompt += "Une traduction complète et fidèle de l'article en Espagnol, en respectant le ton journalistique et professionnel d'origine. Ne génère QUE le texte de l'article en espagnol.";
      break;
    case 'pt_translation':
      prompt += "Une traduction complète et fidèle de l'article en Portugais, en respectant le ton journalistique et professionnel d'origine. Ne génère QUE le texte de l'article en portugais.";
      break;
    case 'bushinengue_translation':
      prompt += "Une traduction complète et fidèle de l'article en Bushinengué (Nengee Tongo), langue de Guyane et du Suriname, en respectant le ton d'origine. Ne génère QUE le texte dans cette langue.";
      break;
    case 'thumbnail_prompt':
      prompt += "Un prompt ultra-détaillé en ANGLAIS (pour Midjourney/DALL-E) décrivant une image d'illustration (miniature) captivante pour cet article. Seulement le prompt.";
      break;
    case 'seo':
      prompt += "Les métadonnées SEO pour cet article : Une liste de 5 mots-clés séparés par des virgules, et une meta-description très accrocheuse de 150 caractères maximum.";
      break;
    default:
      return { success: false, error: 'Format inconnu.' };
  }

  // Except for the full translations formats, we always want FR and Bushinengue
  if (!format.includes('translation')) {
    prompt += `\n\nCONTRAINTE OBLIGATOIRE : Tu dois IMPÉRATIVEMENT fournir DEUX versions de ta réponse :
1. D'abord, génère la version en Français.
2. Ensuite, ajoute EXACTEMENT le séparateur suivant sur une nouvelle ligne : ===BUSHINENGUE===
3. Enfin, génère la même version traduite en Bushinengué (Nengee Tongo).`;
  }

  if (instructions) {
    prompt += `\n\nINSTRUCTIONS SPÉCIFIQUES POUR CETTE VERSION :\n${instructions}`;
  }

  try {
    const modelsToTry = ['gemini-1.5-pro-002', 'gemini-1.5-pro-001', 'gemini-1.5-flash-002', 'gemini-1.5-flash-001', 'gemini-flash-latest'];
    let lastError;

    for (const modelName of modelsToTry) {
      try {
        const currentModel = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: { temperature: 0.7 }
        });
        
        const result = await currentModel.generateContent(prompt);
        const text = result.response.text();
        
        // Save automatically
        await saveSpinoffs(articleId, { [format]: text.trim() });

        return { success: true, text: text.trim(), modelUsed: modelName };
      } catch (e) {
        lastError = e;
        console.warn(`[Spinoff] Model ${modelName} failed:`, e.message);
        
        // If it's a quota error (429), stop trying other models because the user has hit their rate limit
        if (e.message && e.message.includes('429')) {
          return { success: false, error: "Limite de requêtes atteinte (Quota API Google). Veuillez patienter 1 minute avant de regénérer." };
        }
      }
    }
    
    throw lastError || new Error("Tous les modèles ont échoué.");
  } catch (error) {
    console.error('Spinoff generation error:', error);
    return { success: false, error: error.message };
  }
}

export async function publishToFacebook(articleId, text) {
  const facebookPageId = process.env.FACEBOOK_PAGE_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!facebookPageId || !accessToken) {
    return { success: false, error: "Configuration Meta (Facebook) manquante." };
  }

  const supabase = await createClient();
  const { data: article } = await supabase
    .from('articles')
    .select('slug, id')
    .eq('id', articleId)
    .single();

  // Replace [LIEN_ARTICLE] or [LIEN ICI] with real URL
  const articleUrl = article?.slug ? `https://www.afolukutv.com/article/${article.slug}` : `https://www.afolukutv.com/article/${articleId}`;
  const finalMessage = text.replace(/\[(LIEN_ARTICLE|LIEN ICI)\]/gi, articleUrl);

  try {
    const fbResponse = await fetch(`https://graph.facebook.com/v19.0/${facebookPageId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: finalMessage,
        access_token: accessToken
      })
    });
    
    const fbData = await fbResponse.json();
    if (fbData.error) {
      throw new Error(fbData.error.message);
    }
    
    // Update article with facebook post id
    await supabase
      .from('articles')
      .update({ facebook_post_id: fbData.id })
      .eq('id', articleId);

    return { success: true, postId: fbData.id };
  } catch (e) {
    console.error("Erreur FB Publish Spinoff:", e);
    return { success: false, error: e.message };
  }
}
