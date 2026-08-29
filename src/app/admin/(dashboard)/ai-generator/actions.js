'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getUserProfile } from '@/utils/supabase/auth';
import { createClient } from '@/utils/supabase/server';
import { getKnowledgeRules } from '../knowledge-brain/actions';
import * as cheerio from 'cheerio';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import fs from 'fs';
import os from 'os';
import path from 'path';

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

async function buildKnowledgeContext() {
  try {
    const rules = await getKnowledgeRules();
    if (!rules || rules.length === 0) return '';
    let kbContext = '\n\n=== RÈGLES ÉDITORIALES DE A FOLUKU TV (À RESPECTER STRICTEMENT) ===\n';
    rules.forEach(rule => {
      kbContext += `- [${rule.category.toUpperCase()}] ${rule.title}: ${rule.content}\n`;
    });
    return kbContext + '=================================================================\n\n';
  } catch (e) {
    console.warn("Could not fetch knowledge rules", e);
    return '';
  }
}


export async function generateArticleDraft(formData) {
  try {
    const profile = await getUserProfile();
    if (!profile || (profile.role !== 'admin' && profile.role !== 'author')) {
      return { success: false, error: 'Non autorisé' };
    }

    const subject = formData.get('subject');
    const context = formData.get('context') || '';
    const links = formData.get('links') || '';
    const imageUrlsJson = formData.get('imageUrls') || '[]';
    
    let imageUrls = [];
    try {
      imageUrls = JSON.parse(imageUrlsJson);
    } catch(e) {
      console.warn("Could not parse imageUrls", e);
    }
    
    const referenceArticleId = formData.get('referenceArticleId');

    if (!subject) return { success: false, error: "Le sujet est requis." };

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

    let knowledgeContext = await buildKnowledgeContext();

    let prompt = `
Écris un article complet et formaté en HTML sur le sujet suivant: "${subject}".
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

  try {
    const modelsToTry = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.5-pro', 'gemini-3.5-flash', 'gemini-2.0-flash'];
    let lastError;

    for (const modelName of modelsToTry) {
      try {
        const currentModel = genAI.getGenerativeModel({ 
          model: modelName,
          systemInstruction: `Tu es un journaliste professionnel expert et rigoureux.\n${knowledgeContext}\nCONSIGNE ABSOLUE : Tu DOIS respecter les Mots Interdits et les Règles Éditoriales de A FOLUKU TV à la lettre. C'est une question de survie pour l'entreprise.`
        });
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
  } catch (error) {
    console.error('Erreur Action:', error);
    return { success: false, error: error.message || "Une erreur inattendue est survenue." };
  }
}

export async function adjustArticleDraft(previousData, instruction) {
  try {
    const profile = await getUserProfile();
    if (!profile || (profile.role !== 'admin' && profile.role !== 'author')) {
      return { success: false, error: 'Non autorisé' };
    }

  let knowledgeContext = await buildKnowledgeContext();

  const prompt = `
J'ai un brouillon d'article et je veux que tu l'ajustes selon cette instruction: "${instruction}"

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
    const modelsToTry = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.5-pro', 'gemini-3.5-flash', 'gemini-2.0-flash'];
    let lastError;

    for (const modelName of modelsToTry) {
      try {
        const currentModel = genAI.getGenerativeModel({ 
          model: modelName,
          systemInstruction: `Tu es un journaliste professionnel expert.\n${knowledgeContext}\nCONSIGNE ABSOLUE : Tu DOIS respecter les Mots Interdits et les Règles Éditoriales de A FOLUKU TV à la lettre.`
        });
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
    console.error('Erreur adjustArticleDraft:', error);
    return { success: false, error: error.message || "Une erreur s'est produite avec l'IA." };
  }
  } catch (error) {
    console.error('Erreur Action:', error);
    return { success: false, error: error.message || "Une erreur inattendue est survenue." };
  }
}

export async function suggestTitles(content) {
  try {
    const profile = await getUserProfile();
    if (!profile || (profile.role !== 'admin' && profile.role !== 'author')) {
      return { success: false, error: 'Non autorisé' };
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
    const modelsToTry = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.5-pro', 'gemini-3.5-flash', 'gemini-2.0-flash'];
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
    console.error('Erreur suggestTitles:', error);
    return { success: false, error: error.message || "Une erreur s'est produite avec l'IA." };
  }
  } catch (error) {
    console.error('Erreur Action:', error);
    return { success: false, error: error.message || "Une erreur inattendue est survenue." };
  }
}

export async function generateSuperArticle(formData) {
  try {
    const profile = await getUserProfile();
    if (!profile || (profile.role !== 'admin' && profile.role !== 'author')) {
      return { success: false, error: 'Non autorisé' };
    }

    const subject = formData.get('subject') || '';
    const file = formData.get('file'); // Fichier binaire (PDF, Audio, Vidéo)
    const links = formData.get('links') || '';
    
    if (!subject && !file && !links) {
      return { success: false, error: "Veuillez fournir un sujet, un lien, ou un fichier." };
    }

    let fileUri = null;
    let mimeType = null;
    let tempFilePath = null;

    // 1. Gestion du Fichier Multi-modal
    if (file && file.size > 0) {
      if (file.size > 50 * 1024 * 1024) {
        return { success: false, error: "Le fichier dépasse la limite de 50 Mo." };
      }
      
      const buffer = Buffer.from(await file.arrayBuffer());
      tempFilePath = path.join(os.tmpdir(), `${Date.now()}_${file.name}`);
      fs.writeFileSync(tempFilePath, buffer);
      
      mimeType = file.type;
      
      try {
        const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);
        const uploadResult = await fileManager.uploadFile(tempFilePath, {
          mimeType: mimeType,
          displayName: file.name,
        });
        fileUri = uploadResult.file.uri;
      } catch (err) {
        console.error("Erreur GoogleAIFileManager:", err);
        return { success: false, error: "Impossible de traiter le fichier média avec l'IA." };
      }
    }

    // 2. Gestion des liens (Scraping)
    let scrapedContent = '';
    if (links) {
      // Basic youtube description scraping could be added here, but for now fallback to standard scrape
      scrapedContent = await scrapeUrls(links);
    }

    // 3. Knowledge Brain
    let knowledgeContext = await buildKnowledgeContext();

    // 4. Le Super Prompt
    const prompt = `Tu es un Rédacteur en Chef et Expert SEO de "A FOLUKU TV".
Ta mission est d'analyser les sources fournies (texte, fichier audio/vidéo/pdf, ou contenu web) et de générer une structure d'article de presse ultra-complète.

Source(s) fournie(s) :
Sujet / Instructions : "${subject}"
${scrapedContent ? `Contenu Web Extrait : ${scrapedContent}` : ''}
${fileUri ? `(Un fichier média a été transmis via l'API, analyse son contenu attentivement)` : ''}

CONSIGNE CRITIQUE : Tu DOIS renvoyer ta réponse STRICTEMENT sous forme d'un objet JSON, sans balises Markdown. Structure exigée :
{
  "title": "Titre principal ultra-accrocheur",
  "alternate_titles": ["Alternative 1", "Alternative 2", "Alternative 3", "Alternative 4"],
  "chapo": "Le chapô (1 ou 2 phrases très percutantes qui résument l'essentiel)",
  "summary": "Un résumé analytique plus long (1 paragraphe complet) pour les lecteurs pressés",
  "meta_description": "La méta-description SEO optimisée (max 160 caractères)",
  "keywords": ["mot-clé 1", "mot-clé 2", "mot-clé 3", "mot-clé 4"],
  "categories": ["Catégorie principale"],
  "tags": ["Tag1", "Tag2", "Tag3"],
  "internal_links_suggestions": ["Idée de lien interne 1", "Idée de lien interne 2"],
  "external_links_suggestions": [{"text": "Texte cliquable", "url": "URL suggérée (si connue, sinon laisser vide)"}],
  "suggested_images": ["Description (prompt) pour l'image 1", "Description pour l'image 2"],
  "reading_time": 3,
  "seo_score": 85,
  "readability_score": 90,
  "content": "Le corps de l'article formaté en HTML propre (<h2>, <p>, <strong>, <ul>). Ajoute une section <h2>Sources</h2> à la fin avec des liens réels si possible."
}
`;

    // 5. Génération
    const promptParts = [prompt];
    if (fileUri) {
      // Ajout de la référence au fichier stocké sur les serveurs Google
      promptParts.push({ fileData: { fileUri: fileUri, mimeType: mimeType } });
    }

    try {
      const modelsToTry = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-pro-002', 'gemini-1.5-pro-001', 'gemini-1.5-flash-002', 'gemini-1.5-flash-001', 'gemini-flash-latest'];
      let lastError;

      for (const modelName of modelsToTry) {
        try {
          const currentModel = genAI.getGenerativeModel({ 
            model: modelName,
            systemInstruction: `Tu es le Rédacteur en Chef Ultime de A FOLUKU TV.\n${knowledgeContext}\nCONSIGNE ABSOLUE : Tu DOIS respecter les Mots Interdits et les Règles Éditoriales à la lettre. Renvoie UNIQUEMENT du JSON.`
          });
          const result = await currentModel.generateContent(promptParts);
          let text = result.response.text();
          
          text = text.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
          const parsed = JSON.parse(text);

          // Nettoyage temporaire du fichier local
          if (tempFilePath && fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
          }

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
      console.error('Erreur Gemini (Super):', error);
      if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      return { success: false, error: error.message };
    }
  } catch (error) {
    console.error('Erreur Action Super:', error);
    return { success: false, error: error.message || "Une erreur inattendue est survenue." };
  }
}
