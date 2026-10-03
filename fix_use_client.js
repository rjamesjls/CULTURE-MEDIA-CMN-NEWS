const fs = require('fs');
const filePath = 'src/app/admin/(dashboard)/instagram/custom/InstagramCustomClient.js';
let content = fs.readFileSync(filePath, 'utf-8');

// Remove 'use client'; from anywhere inside
content = content.replace(/'use client';/g, '');

const helperCode = `'use client';

const getProxiedImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('/')) {
    return url;
  }
  return \`/api/proxy-image?url=\${encodeURIComponent(url)}\`;
};
`;

// Remove previous getProxiedImageUrl definition if prepended
const getProxiedPattern = /const getProxiedImageUrl = [\s\S]*?};\n/;
content = content.replace(getProxiedPattern, '');

// Clean leading newlines
content = content.trim();

// Prepend helperCode with 'use client'; at top
content = helperCode + '\n' + content;

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Fixed 'use client' directive successfully!");
