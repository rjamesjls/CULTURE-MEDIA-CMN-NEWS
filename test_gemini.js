const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.log("NO API KEY");
  process.exit(1);
}

async function listModels() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    if (data.models) {
      console.log("AVAILABLE MODELS:");
      console.log(data.models.map(m => m.name).join('\n'));
    } else {
      console.log("Error fetching models:", data);
    }
  } catch (e) {
    console.error(e);
  }
}
listModels();
