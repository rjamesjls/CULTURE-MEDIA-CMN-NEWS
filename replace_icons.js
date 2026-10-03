const fs = require('fs');
const file = 'src/app/admin/(dashboard)/articles/[id]/social/SocialGenerator.js';
let content = fs.readFileSync(file, 'utf8');

const broadcastSvg = `<span style={{ marginRight: "15px", display: "flex", alignItems: "center" }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" fill="white" stroke="none" />
                <path d="M8 8.5a5 5 0 0 0 0 7" />
                <path d="M5 5.5a9 9 0 0 0 0 13" />
                <path d="M16 8.5a5 5 0 0 1 0 7" />
                <path d="M19 5.5a9 9 0 0 1 0 13" />
              </svg>
            </span>`;

const locationSvg = `<span style={{ marginRight: "15px", display: "flex", alignItems: "center" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0d069b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
                <circle cx="12" cy="10" r="3" fill="#0d069b" stroke="none" />
              </svg>
            </span>`;

content = content.replace(/<span style=\{\{ marginRight: "15px" \}\}>\(\(•\)\)<\/span>/g, broadcastSvg);
content = content.replace(/<i className=\"fas fa-map-marker-alt\" style=\{\{ marginRight: "15px" \}\}><\/i>/g, locationSvg);

fs.writeFileSync(file, content);
