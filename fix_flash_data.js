const fs = require('fs');
const file = 'src/app/admin/(dashboard)/articles/[id]/social/SocialGenerator.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /const currentData = lang === \"fr\" \? templateData\.fr : templateData\.bsh;/g,
  'const flashData = templateData["template-flash"] || initialTemplateState;'
);

// We need to change {currentData.title_fr || currentData.title} to use flashData
content = content.replace(
  /\{currentData\.title_fr \|\| currentData\.title\}/g,
  '{lang === "fr" ? (flashData.title_fr || flashData.title) : (flashData.title_bsh || flashData.title)}'
);

fs.writeFileSync(file, content);
