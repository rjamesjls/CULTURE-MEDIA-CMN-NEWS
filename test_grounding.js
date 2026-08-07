const { GoogleGenerativeAI } = require('@google/generative-ai');


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testGrounding() {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      tools: [{ googleSearch: {} }]
    });
    
    const result = await model.generateContent("Who won the super bowl in 2024?");
    console.log(result.response.text());
  } catch (e) {
    console.error("Error with googleSearch:", e.message);
  }
}
testGrounding();
