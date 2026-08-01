'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getUserProfile } from '@/utils/supabase/auth';
import { createClient } from '@/utils/supabase/server';

import * as cheerio from 'cheerio';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

// Using gemini-flash-latest due to Free Tier limitations on the user's API key
const model = genAI.getGenerativeModel({
  model: 'gemini-flash-latest',
});

async function scrapeUrls(urlsString) {
  if (!urlsString) return '';
  const urls = urlsString.split(',').map(u => u.trim()).filter(u => u.startsWith('http'));
  if (urls.length === 0) return '';

  let scrapedText = '';
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
      if (!res.ok) continue;
      const html = await res.text();
      const $ = cheerio.load(html);
      
      // Enlever le superflu
      $('script, style, nav, footer, header, aside, .ad, .advertisement').remove();
      
      const text = $('body').text().replace(/\s+/g, ' ').trim();
      // On prend max 4000 caractères par URL pour ne pas exploser le token limit
      scrapedText += `\n\n--- Source Extraite: ${url} ---\n${text.substring(0, 4000)}`;
    } catch (e) {
      console.error("Scraping error for", url, e);
    }
  }
  return scrapedText;
}

export async function generateArticleDraft(formData) {
  const profile = await getUserProfile();
  if (!profile || (profile.role !== 'admin' && profile.role !== 'author')) {
    throw new Error('Non autorisé');
  }

  const subject = formData.get('subject');
  const context = formData.get('context') || '';
  const links = formData.get('links') || '';
  const imageUrlsJson = formData.get('imageUrls') || '[]';
  const imageUrls = JSON.parse(imageUrlsJson);
  const referenceArticleId = formData.get('referenceArticleId');

  if (!subject) throw new Error("Le sujet est requis.");

  let referenceContent = '';
  if (referenceArticleId) {
    const supabase = await createClient();
    const { data: refArticle } = await supabase
      .from('articles')
      .select('title, content')
      .eq('id', referenceArticleId)
      .single();
    
    if (refArticle) {
      referenceContent = `\nVoici l'article de référence dont tu dois t'inspirer (titre : "${refArticle.title}"). Utilise les informations de cet article de référence pour t'aider à rédiger le nouveau contenu ou pour garder une continuité éditoriale :\n${refArticle.content}\n`;
    }
  }

  let scrapedContent = '';
  if (links) {
    scrapedContent = await scrapeUrls(links);
  }

  let prompt = `
Tu es un journaliste professionnel expert et rigoureux. Écris un article complet et formaté en HTML sur le sujet suivant: "${subject}".
${context ? `Prends en compte ce contexte supplémentaire: "${context}"` : ''}
${referenceContent}
${scrapedContent ? `Voici le contenu extrait d'URL(s) source(s) que tu DOIS lire, analyser, et utiliser comme base pour rédiger l'article : ${scrapedContent}\n\n` : ''}
${imageUrls.length > 0 ? `Voici une liste d'URLs d'images que tu DOIS OBLIGATOIREMENT insérer de manière esthétique et pertinente dans le corps de ton article HTML. Utilise exactement ces URLs dans la syntaxe HTML suivante: <figure style="margin: 20px 0;"><img src="URL_DE_L_IMAGE" alt="description pertinente de l'image" style="width: 100%; border-radius: 8px;"/><figcaption style="text-align:center; color:#6b7280; font-size:14px; margin-top:8px;">Description de la photo</figcaption></figure> : ${imageUrls.join(', ')}\n\n` : ''}

Ton article doit être structuré, engageant et prêt à être publié sur un média en ligne.

CONSIGNE CRITIQUE : Tu DOIS citer tes sources et elles doivent être réelles et vérifiables. 
À la fin du contenu HTML de l'article, ajoute une section "<h2>Sources</h2>" contenant une liste à puces (<ul><li>) des sources fiables et vérifiables (avec des liens hypertexte réels <a href="..."> si possible) qui corroborent les faits de cet article.


IMPORTANT: Tu dois renvoyer la réponse **UNIQUEMENT** sous la forme d'un objet JSON valide, sans balises Markdown comme \`\`\`json, avec exactement cette structure:
{
  "title": "Un titre accrocheur pour l'article",
  "description": "Une courte description (extrait) de 2 ou 3 phrases maximum.",
  "content": "Le contenu complet de l'article formaté en HTML (utilise <h2>, <p>, <strong>, etc., incluant la section Sources à la fin. N'utilise pas <h1> ni <html> ou <body>)."
}
`;

  const promptParts = [prompt];

  // Ajouter les fichiers (images/pdf) s'ils existent
  for (const file of files) {
    if (file && file.size > 0) {
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      promptParts.push({
        inlineData: {
          data: base64,
          mimeType: file.type
        }
      });
    }
  }

  try {
    const modelsToTry = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-3.5-flash', 'gemini-2.0-flash'];
    let lastError;

    for (const modelName of modelsToTry) {
      try {
        const currentModel = genAI.getGenerativeModel({ model: modelName });
        const result = await currentModel.generateContent(promptParts);
        let text = result.response.text();
        
        text = text.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();

        const parsed = JSON.parse(text);
        return { success: true, data: parsed };
      } catch (err) {
        lastError = err;
        console.error(`Erreur avec ${modelName}:`, err.message);
        if (!err.message.includes("503") && !err.message.includes("429")) {
          throw err;
        }
      }
    }
    throw lastError;
  } catch (error) {
    console.error('Erreur Gemini:', error);
    return { success: false, error: error.message || "Une erreur s'est produite avec l'IA." };
  }
}

export async function adjustArticleDraft(previousData, instruction) {
  const profile = await getUserProfile();
  if (!profile || (profile.role !== 'admin' && profile.role !== 'author')) {
    throw new Error('Non autorisé');
  }

  const prompt = `
Tu es un journaliste professionnel expert. J'ai un brouillon d'article et je veux que tu l'ajustes selon cette instruction: "${instruction}"

Voici le brouillon actuel:
Titre: ${previousData.title}
Description: ${previousData.description}
Contenu HTML: ${previousData.content}

Mets à jour ce qui est nécessaire selon mon instruction, et renvoie la totalité de l'article mis à jour.

CONSIGNE CRITIQUE : Tu DOIS conserver ou ajouter des sources réelles et vérifiables. À la fin du contenu HTML de l'article, il doit y avoir une section "<h2>Sources</h2>" contenant une liste à puces (<ul><li>) des sources fiables et vérifiables (avec des liens hypertexte réels <a href="..."> si possible). N'invente AUCUNE source et AUCUN faux lien.

IMPORTANT: Tu dois renvoyer la réponse **UNIQUEMENT** sous la forme d'un objet JSON valide, sans balises Markdown comme \`\`\`json, avec exactement cette structure:
{
  "title": "Le titre",
  "description": "La courte description",
  "content": "Le contenu HTML incluant la section Sources"
}
`;

  try {
    const modelsToTry = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-3.5-flash', 'gemini-2.0-flash'];
    let lastError;

    for (const modelName of modelsToTry) {
      try {
        const currentModel = genAI.getGenerativeModel({ model: modelName });
        const result = await currentModel.generateContent(prompt);
        let text = result.response.text();
        
        text = text.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();

        const parsed = JSON.parse(text);
        return { success: true, data: parsed };
      } catch (err) {
        lastError = err;
        console.error(`Erreur avec ${modelName}:`, err.message);
        if (!err.message.includes("503") && !err.message.includes("429")) {
          throw err;
        }
      }
    }
    throw lastError;
  } catch (error) {
    console.error('Erreur Gemini:', error);
    return { success: false, error: error.message || "Une erreur s'est produite avec l'IA." };
  }
}

export async function suggestTitles(content) {
  const profile = await getUserProfile();
  if (!profile || (profile.role !== 'admin' && profile.role !== 'author')) {
    throw new Error('Non autorisé');
  }

  const prompt = `
Tu es un rédacteur en chef expert. 
Lis le contenu de l'article ci-dessous et propose 5 titres alternatifs très accrocheurs, percutants et optimisés pour le web (journalisme numérique).

Contenu de l'article :
${content}

IMPORTANT: Tu dois renvoyer la réponse **UNIQUEMENT** sous la forme d'un tableau JSON valide de 5 chaînes de caractères, SANS balises Markdown.
Exemple attendu :
["Titre 1", "Titre 2", "Titre 3", "Titre 4", "Titre 5"]
`;

  try {
    const modelsToTry = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-3.5-flash', 'gemini-2.0-flash'];
    let lastError;

    for (const modelName of modelsToTry) {
      try {
        const currentModel = genAI.getGenerativeModel({ model: modelName });
        const result = await currentModel.generateContent(prompt);
        let text = result.response.text();
        
        text = text.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();

        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          return { success: true, data: parsed };
        } else {
          throw new Error("Le résultat n'est pas un tableau.");
        }
      } catch (err) {
        lastError = err;
        console.error(`Erreur avec ${modelName}:`, err.message);
        if (!err.message.includes("503") && !err.message.includes("429")) {
          throw err;
        }
      }
    }
    throw lastError;
  } catch (error) {
    console.error('Erreur Gemini:', error);
    return { success: false, error: error.message || "Une erreur s'est produite avec l'IA." };
  }
}
