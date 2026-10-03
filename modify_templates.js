const fs = require('fs');
const file = 'src/app/admin/(dashboard)/articles/[id]/social/SocialGenerator.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Change default states
content = content.replace(
  /useState\(article\.instagram_state\?\.selectedTemplateBsh \|\| \"template-3\"\);/g,
  'useState(article.instagram_state?.selectedTemplateBsh || "template-2");'
);

// 2. Change the dropdown menu
content = content.replace(
  /\{\[\s*\{\s*id:\s*\"template-1\"[\s\S]*?\]\.map/g,
  `{[
                  { id: "template-2", label: "Éditorial AFOLUKU TV" },
                  { id: "template-flash", label: "Flash Info (Provisoire)" }
                ].map`
);

// 3. Add the renderTemplateFlash call in the UI
content = content.replace(
  /\{selectedTemplateFr === \"template-5\" && renderTemplate5\(\"fr\", postRefFr\)\}/g,
  `{selectedTemplateFr === "template-5" && renderTemplate5("fr", postRefFr)}
                    {selectedTemplateFr === "template-flash" && renderTemplateFlash("fr", postRefFr)}`
);

content = content.replace(
  /\{selectedTemplateBsh === \"template-5\" && renderTemplate5\(\"bsh\", postRefBsh\)\}/g,
  `{selectedTemplateBsh === "template-5" && renderTemplate5("bsh", postRefBsh)}
                    {selectedTemplateBsh === "template-flash" && renderTemplateFlash("bsh", postRefBsh)}`
);

fs.writeFileSync(file, content);
