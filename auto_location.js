const fs = require('fs');
const file = 'src/app/admin/(dashboard)/articles/[id]/social/SocialGenerator.js';
let content = fs.readFileSync(file, 'utf8');

const detectionLogic = `
function detectLocation(article) {
  if (!article) return "CAYENNE";
  const text = ((article.title || "") + " " + (article.content || "")).toUpperCase();
  const cities = ["KOUROU", "SAINT-LAURENT", "SAINT-GEORGES", "MATOURY", "REMIRE-MONTJOLY", "RÉMIRE-MONTJOLY", "MANA", "AWALA-YALIMAPO", "MACOURIA", "SINNAMARY", "IRACOUBO", "ROURA", "CAYENNE"];
  for (let city of cities) {
    if (text.includes(city)) return city.replace("RÉMIRE", "REMIRE");
  }
  return "CAYENNE";
}
`;

// Inject detectionLogic before initialTemplateState
content = content.replace(
  `  const initialTemplateState = {`,
  detectionLogic + `\n  const initialTemplateState = {`
);

// Replace location: "CAYENNE" with location: detectLocation(article)
content = content.replace(
  `location: "CAYENNE",`,
  `location: detectLocation(article),`
);

fs.writeFileSync(file, content);
