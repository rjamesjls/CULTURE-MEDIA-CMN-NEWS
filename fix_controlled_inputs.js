const fs = require('fs');
const filePath = 'src/app/admin/(dashboard)/instagram/custom/InstagramCustomClient.js';
let content = fs.readFileSync(filePath, 'utf-8');

content = content.replaceAll("value={activePage.partnerText}", "value={activePage.partnerText || ''}");
content = content.replaceAll("value={activePage.tag}", "value={activePage.tag || ''}");
content = content.replaceAll("value={activePage.themeColor}", "value={activePage.themeColor || '#D32F2F'}");
content = content.replaceAll("value={activePage.titleSize}", "value={activePage.titleSize || 80}");
content = content.replaceAll("value={activePage.title}", "value={activePage.title || ''}");
content = content.replaceAll("value={activePage.contentSize}", "value={activePage.contentSize || 30}");
content = content.replaceAll("value={activePage.content}", "value={activePage.content || ''}");
content = content.replaceAll("value={activePage.logoType}", "value={activePage.logoType || 'white'}");
content = content.replaceAll("value={caption}", "value={caption || ''}");

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Fixed all controlled inputs in InstagramCustomClient.js successfully!");
