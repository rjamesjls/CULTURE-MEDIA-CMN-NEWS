'use server';

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getUserProfile } from '@/utils/supabase/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

export async function createInterviewCampaign(data) {
  try {
    const { title, description, sections } = data;
    
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // `sections` is already the structured format:
    // [{ section: "Name", questions: ["Q1", "Q2"] }, ...]
    // We store it in the `questions` JSONB column for backward compat
    const { error } = await supabaseAdmin
      .from('interview_campaigns')
      .insert([
        { title, description, questions: sections, token }
      ]);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function toggleCampaignStatus(id, currentStatus) {
  try {
    const { error } = await supabaseAdmin
      .from('interview_campaigns')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function deleteCampaign(id) {
  try {
    const { error } = await supabaseAdmin
      .from('interview_campaigns')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function generateInterviewQuestions(brief) {
  const profile = await getUserProfile();
  if (!profile || (profile.role !== 'admin' && profile.role !== 'author')) {
    throw new Error('Non autorisé');
  }

  const prompt = `
Tu es un journaliste professionnel expert en interviews. À partir du brief suivant, génère un formulaire d'interview structuré en sections thématiques.

Brief : "${brief}"

Génère entre 3 et 6 sections thématiques pertinentes, chacune contenant 2 à 4 questions percutantes et ouvertes.

IMPORTANT: Tu dois renvoyer la réponse **UNIQUEMENT** sous la forme d'un objet JSON valide, sans balises Markdown comme \`\`\`json, avec exactement cette structure:
{
  "sections": [
    {
      "section": "Nom de la thématique",
      "questions": ["Question 1", "Question 2", "Question 3"]
    }
  ]
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
        if (parsed.sections && Array.isArray(parsed.sections)) {
          return { success: true, data: parsed.sections };
        } else {
          throw new Error("Format de réponse invalide.");
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
