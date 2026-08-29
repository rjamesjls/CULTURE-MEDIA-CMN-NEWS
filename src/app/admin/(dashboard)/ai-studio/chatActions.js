'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

export async function sendChatToAssistant(messages) {
  if (!apiKey) {
    return { success: false, error: 'Clé API Gemini manquante.' };
  }

  try {
    const systemPrompt = `Tu es un rédacteur en chef adjoint expert pour A FOLUKU TV.
Ton rôle est de discuter avec le journaliste (l'utilisateur) pour l'aider à affiner son idée d'article ou de campagne AVANT de générer le contenu final.
Tu as accès à l'outil Google Search. Si l'utilisateur te demande de chercher des informations sur le web ou si tu as besoin de vérifier une info récente, N'HÉSITE PAS à chercher sur Internet pour étoffer ta réponse.
Tu dois être concis, inspirant et constructif. Pose des questions pertinentes si le sujet est trop vague (quel angle ? quelle cible ? quel ton ?). Fais des suggestions créatives.
Ne génère PAS l'article complet. Limite-toi à une discussion (2-3 phrases max par réponse). 
Si l'idée est déjà claire, valide-la avec enthousiasme et invite-le à lancer l'Omni-Génération !`;

    // Convert internal message format to Gemini chat format
    let history = messages.slice(0, -1).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Gemini requires the history to start with a 'user' role
    const firstUserIndex = history.findIndex(msg => msg.role === 'user');
    if (firstUserIndex === -1) {
      history = [];
    } else {
      history = history.slice(firstUserIndex);
    }

    const lastMessage = messages[messages.length - 1].content;

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt,
      tools: [{ googleSearch: {} }]
    });

    const chat = model.startChat({
      history: history,
      generationConfig: {
        maxOutputTokens: 300,
      },
    });

    const result = await chat.sendMessage(lastMessage);
    const response = await result.response;
    const text = response.text();
    
    console.log('Gemini raw text:', text);
    if (!text) {
      console.log('Response object:', JSON.stringify(response, null, 2));
    }

    return { success: true, text: text || "Je n'ai pas pu formuler de réponse (texte vide)." };

  } catch (error) {
    console.error('Chat error object:', error);
    console.error('Chat error name:', error?.name);
    console.error('Chat error message:', error?.message);
    console.error('Chat error stack:', error?.stack);
    
    return { 
      success: false, 
      error: error?.message || 'Erreur inconnue (voir console serveur)' 
    };
  }
}
