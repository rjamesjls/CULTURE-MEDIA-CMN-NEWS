const fs = require('fs');
const filePath = 'src/app/admin/(dashboard)/instagram/custom/InstagramCustomClient.js';
let content = fs.readFileSync(filePath, 'utf-8');

// Fix renderTextWithHighlights plain string return
const oldHighlightReturn = "      return part;\n    });";
const newHighlightReturn = "      return <span key={i}>{part}</span>;\n    });";

if (content.includes(oldHighlightReturn)) {
  content = content.replace(oldHighlightReturn, newHighlightReturn);
}

// Fix savedSessions map key if missing
content = content.replace('savedSessions.map(s => (', 'savedSessions.map((s, idx) => (');

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Fixed React list key warnings in InstagramCustomClient.js successfully!");
