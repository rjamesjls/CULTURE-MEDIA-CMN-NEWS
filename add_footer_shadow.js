const fs = require('fs');
const file = 'src/app/admin/(dashboard)/articles/[id]/social/SocialGenerator.js';
let content = fs.readFileSync(file, 'utf8');

const target = `{/* Footer Source Text (absolute positioned over background) */}`;
const replacement = `{/* Dark overlay to darken the footer area */}
      <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "200px", background: "linear-gradient(to top, rgba(0,0,0,0.4), transparent)", zIndex: 1, pointerEvents: "none" }}></div>

      {/* Footer Source Text (absolute positioned over background) */}`;

// Only apply to renderTemplate2
const t2Start = content.indexOf('const renderTemplate2');
const t3Start = content.indexOf('const renderTemplate3');

let beforeT2 = content.substring(0, t2Start);
let t2Content = content.substring(t2Start, t3Start);
let afterT2 = content.substring(t3Start);

t2Content = t2Content.replace(target, replacement);

fs.writeFileSync(file, beforeT2 + t2Content + afterT2);
