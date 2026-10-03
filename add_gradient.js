const fs = require('fs');
const file = 'src/app/admin/(dashboard)/articles/[id]/social/SocialGenerator.js';
let content = fs.readFileSync(file, 'utf8');

const oldText = '} {currentData.location || "CAYENNE"}';
const newText = `} <span style={{ background: "linear-gradient(to right, #0d069b, #e41318)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{currentData.location || "CAYENNE"}</span>`;

content = content.replace(/\} \{currentData\.location \|\| \"CAYENNE\"\}/g, newText);

fs.writeFileSync(file, content);
