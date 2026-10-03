const fs = require('fs');
const filePath = 'src/app/admin/(dashboard)/instagram/custom/InstagramCustomClient.js';
let content = fs.readFileSync(filePath, 'utf-8');

// Replace all occurrences of src={bgImage} with src={getProxiedImageUrl(bgImage)}
content = content.replaceAll('src={bgImage}', 'src={getProxiedImageUrl(bgImage)}');

// Remove crossOrigin="anonymous" from image tags and add referrerPolicy="no-referrer"
content = content.replaceAll('crossOrigin="anonymous"', 'referrerPolicy="no-referrer"');

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Replaced all bgImage & crossOrigin tags with proxied URLs successfully!");
