'use server';

import { createClient } from '@/utils/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getKnowledgeRules, getDictionaryTerms } from '../../../knowledge-brain/actions';
import { revalidatePath } from 'next/cache';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function getArticleForStory(articleId) {
  const supabase = await createClient();
  const { data: article, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', articleId)
    .single();
  
  if (error || !article) {
    return { success: false, error: 'Article introuvable.' };
  }
  return { success: true, article };
}

export async function generateStoryPost(articleId, lang = 'fr') {
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

  const rules = await getKnowledgeRules().catch(() => []);
  const rulesContext = rules?.map(r => `- [${r.category}] ${r.title}: ${r.content}`).join('\n') || 'Aucune règle spécifique.';

  const dictionary = await getDictionaryTerms(lang === 'bsh' ? 'Bushinengué' : 'Français').catch(() => []);
  const dictContext = dictionary?.map(d => `- Le mot "${d.source_term}" se traduit par "${d.translated_term}" (Contexte: ${d.context || 'Aucun'})`).join('\n') || 'Aucun terme spécifique.';

  let languageInstruction = "Génère UNIQUEMENT le texte de la story en FRANÇAIS.";
  if (lang === 'bsh') {
    languageInstruction = "Génère UNIQUEMENT le texte de la story en langue Bushinengé (langues de Guyane comme Ndyuka, Aluku, Pamaka, Sranan Tongo). IMPORTANT: PAS DE CRÉOLE HAÏTIEN OU ANTILLAIS.";
  }

  const prompt = `Ta mission est de créer un texte ultra-court et impactant pour une STORY Instagram / Facebook, basé sur l'article ci-dessous.

Voici le dictionnaire local que tu dois utiliser pour le vocabulaire si applicable :
${dictContext}

CONTRAINTES POUR LA STORY :
- Le format Story est vertical (9:16). Les gens swipent très vite.
- Le texte doit être ULTRA-COURT (maximum 1 ou 2 phrases choc).
- Utilise des émojis pertinents (mais pas trop).
- Termine par un Call-to-Action très clair (ex: "Lien en bio 🔗", "Clique ici pour lire", "Swipe up").
- Ne mets pas de hashtags, ce n'est pas un post classique.

L'ARTICLE :
Titre : ${article.title}
Description : ${article.description}
Contenu :
${article.content}

${languageInstruction}`;

  try {
    const modelsToTry = ['gemini-1.5-flash-latest', 'gemini-flash-latest'];
    let lastError;
    
    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          systemInstruction: `Tu es un Community Manager expert pour "A FOLUKU TV".\n=== RÈGLES ÉDITORIALES (KNOWLEDGE BRAIN) ===\n${rulesContext}\nCONSIGNE ABSOLUE : Tu DOIS respecter les Mots Interdits et les Règles Éditoriales à la lettre.`
        });
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
    console.error("Erreur Gemini (Story):", error);
    return { success: false, error: "Impossible de générer la Story via l'IA: " + error.message };
  }
}

export async function saveStoryData(articleId, storyData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('articles')
    .update({ story_data: storyData })
    .eq('id', articleId);

  if (error) {
    console.error("Erreur sauvegarde story_data:", error);
    return { success: false, error: error.message };
  }
  
  revalidatePath(`/admin/articles/${articleId}/story`);
  return { success: true };
}

export async function publishStoryToMeta(base64Image) {
  try {
    const facebookPageId = process.env.FACEBOOK_PAGE_ID;
    const instagramAccountId = process.env.INSTAGRAM_ACCOUNT_ID;
    const accessToken = process.env.META_ACCESS_TOKEN;

    if (!facebookPageId || !instagramAccountId || !accessToken || !base64Image) {
      return { 
        success: false, 
        error: "Configuration Meta manquante (ID Page/Compte ou Token) ou image vide." 
      };
    }

    const supabase = await createClient();

    // 1. Upload to Supabase to get a public URL for Meta
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    const fileName = `story_${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(`social_posts/${fileName}`, buffer, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from('media')
      .getPublicUrl(`social_posts/${fileName}`);
    
    const publicUrl = publicUrlData.publicUrl;

    // Attendre que le CDN propage l'image
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2. Publier sur Instagram Stories
    let igSuccess = false;
    let igError = null;

    try {
      // Etape 1: Créer le container media_type = STORIES
      const igRes = await fetch(`https://graph.facebook.com/v19.0/${instagramAccountId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: publicUrl,
          media_type: 'STORIES',
          access_token: accessToken
        })
      });
      const igData = await igRes.json();
      if (igData.error) throw new Error(igData.error.message);
      
      const igContainerId = igData.id;

      // Attendre que le container soit prêt
      let isReady = false;
      let attempts = 0;
      while (!isReady && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const statusRes = await fetch(`https://graph.facebook.com/v19.0/${igContainerId}?fields=status_code&access_token=${accessToken}`);
        const statusData = await statusRes.json();
        if (statusData.status_code === 'FINISHED') isReady = true;
        else if (statusData.status_code === 'ERROR') throw new Error(`Erreur traitement story ${igContainerId}`);
        attempts++;
      }
      if (!isReady) throw new Error("Timeout traitement story Instagram");

      // Etape 2: Publier
      const publishRes = await fetch(`https://graph.facebook.com/v19.0/${instagramAccountId}/media_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: igContainerId,
          access_token: accessToken
        })
      });
      const publishData = await publishRes.json();
      if (publishData.error) throw new Error(publishData.error.message);

      igSuccess = true;
    } catch (e) {
      igError = e.message;
      console.error("Erreur IG Story:", e);
    }

    // 3. Publier sur Facebook Stories (Photo Story)
    let fbSuccess = false;
    let fbError = null;

    try {
      const fbRes = await fetch(`https://graph.facebook.com/v19.0/${facebookPageId}/photo_story`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photo_url: publicUrl,
          access_token: accessToken
        })
      });
      const fbData = await fbRes.json();
      if (fbData.error) throw new Error(fbData.error.message);
      fbSuccess = true;
    } catch (e) {
      fbError = e.message;
      console.error("Erreur FB Story:", e);
    }

    if (igSuccess || fbSuccess) {
      let msg = "Story publiée avec succès !";
      if (!igSuccess) msg = "Publié sur FB, mais erreur IG : " + igError;
      if (!fbSuccess) msg = "Publié sur IG, mais erreur FB : " + fbError;
      return { success: true, message: msg };
    } else {
      return { success: false, error: `FB: ${fbError} | IG: ${igError}` };
    }

  } catch (err) {
    console.error("Erreur générale Story Meta:", err);
    return { success: false, error: err.message || "Erreur système lors de la publication." };
  }
}
