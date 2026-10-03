const fs = require('fs');
const filePath = 'src/app/admin/(dashboard)/instagram/custom/InstagramCustomClient.js';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add getProxiedImageUrl helper if not exists
if (!content.includes('const getProxiedImageUrl =')) {
  const helperCode = `
const getProxiedImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('/')) {
    return url;
  }
  return \`/api/proxy-image?url=\${encodeURIComponent(url)}\`;
};
`;
  content = helperCode + content;
}

// 2. Replace src={item.image} with src={getProxiedImageUrl(item.image)} in t4
content = content.replace('src={item.image}', 'src={getProxiedImageUrl(item.image)}');
content = content.replace('src={bgImage}', 'src={getProxiedImageUrl(bgImage)}');

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Applied image proxy helper to InstagramCustomClient.js successfully!");
