const fs = require('fs');
const filePath = 'src/app/admin/(dashboard)/instagram/custom/InstagramCustomClient.js';
let content = fs.readFileSync(filePath, 'utf-8');

const oldCode = `          dataUrl = await htmlToImage.toJpeg(node, {
            quality: 0.95,
            width: 1080,
            height: 1350,
            pixelRatio: 1,
            skipFonts: true
          });`;

const newCode = `          dataUrl = await htmlToImage.toJpeg(node, {
            quality: 0.95,
            width: 1080,
            height: 1350,
            pixelRatio: 1,
            skipFonts: true,
            cacheBust: true,
            imagePlaceholder: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
          });`;

if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode);
}

const oldAlert = "alert(`Erreur lors de la génération des images : ${error.message || error}`);";
const newAlert = "const msg = error?.message || (typeof error === 'string' ? error : 'Impossible d\\'exporter le visuel'); alert(`Erreur lors de la génération des images : ${msg}`);";

if (content.includes(oldAlert)) {
  content = content.replace(oldAlert, newAlert);
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Updated htmlToImage download options & fallback image placeholder!");
