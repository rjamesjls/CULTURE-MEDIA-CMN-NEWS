const { GoogleGenerativeAI } = require('@google/generative-ai');


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testChat() {
  try {
    const systemPrompt = `Tu es un rédacteur en chef adjoint expert pour Culture Média.
Ton rôle est de discuter avec le journaliste (l'utilisateur) pour l'aider à affiner son idée d'article ou de campagne AVANT de générer le contenu final.
Tu dois être concis, inspirant et constructif. Pose des questions pertinentes si le sujet est trop vague (quel angle ? quelle cible ? quel ton ?). Fais des suggestions créatives.
Ne génère PAS l'article complet. Limite-toi à une discussion (2-3 phrases max par réponse). 
Si l'idée est déjà claire, valide-la avec enthousiasme et invite-le à lancer l'Omni-Génération !`;

    let history = [];
    const lastMessage = "cherche des informations sur internet à propose de l'entreprise James Legend studio et on fera un article là-dessus";

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

    console.log({ success: true, text: text });
  } catch (error) {
    console.error('Chat error:', error);
    console.log({ success: false, error: error.message || 'Unknown' });
  }
}
testChat();
