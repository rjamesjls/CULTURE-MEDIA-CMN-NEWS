const fs = require('fs');
const file = 'src/app/admin/(dashboard)/articles/[id]/social/SocialGenerator.js';
let content = fs.readFileSync(file, 'utf8');

const newInit = `  const [templateData, setTemplateData] = useState(() => {
    const base = {
      "template-1": { ...initialTemplateState },
      "template-2": { ...initialTemplateState },
      "template-3": { ...initialTemplateState, logoTheme: "black" },
      "template-4": { ...initialTemplateState },
      "template-5": { ...initialTemplateState },
      "template-flash": { ...initialTemplateState },
    };
    if (article.instagram_state?.templateData) {
      return { ...base, ...article.instagram_state.templateData };
    }
    return base;
  });`;

content = content.replace(/const \[templateData, setTemplateData\] = useState\(\(\) => \{[\s\S]*?\}\);\n/m, newInit + '\n');

// Also fix the activeColors line, it should be currentData.themeColor safely
content = content.replace(/const activeColors = colorThemes\[currentData\.themeColor\] \|\| colorThemes\.red;/g, 'const currentDataSafe = currentData || initialTemplateState;\n  const activeColors = colorThemes[currentDataSafe.themeColor] || colorThemes.red;');

// And fix anywhere currentData is used if it's still possible to be undefined
content = content.replace(/const currentData = templateData\[activeTemplate\];/g, 'const currentData = templateData[activeTemplate] || initialTemplateState;');


fs.writeFileSync(file, content);
