const fs = require('fs');
const file = 'src/app/admin/(dashboard)/articles/[id]/social/SocialGenerator.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Add className="insta-body " + lang to Template 2 and 3 bodies
content = content.replace(
  /\{\/\* Body \*\/\}\n\s*<div\n\s*style=\{\{/g,
  `{/* Body */}\n        <div\n          className={"insta-body " + lang}\n          style={{`
);

// 2. Update CSS in style block
content = content.replace(
  /\.insta-body\.fr strong \{\n\s*color: #facc15 !important;\n\s*\}/g,
  `.insta-body.fr strong {\n          color: #ffce00 !important;\n        }`
);
content = content.replace(
  /\.insta-body\.bsh strong \{\n\s*color: #1e3a8a !important; \/\* Bleu foncé \*\/\n\s*\}/g,
  `.insta-body.bsh strong {\n          color: #e41318 !important; /* Red for better contrast on light background */\n        }`
);

fs.writeFileSync(file, content);
