const fs = require('fs');
const filePath = 'src/app/admin/(dashboard)/instagram/custom/InstagramCustomClient.js';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Fix justifyCenter
content = content.replace("justifyCenter: 'center'", "justifyContent: 'center'");

// 2. Add skipFonts: true to htmlToImage options
const oldOptions = `          dataUrl = await htmlToImage.toJpeg(node, {
            quality: 1,
            width: 1080,
            height: 1350,
            pixelRatio: 1
          });`;

const newOptions = `          dataUrl = await htmlToImage.toJpeg(node, {
            quality: 0.95,
            width: 1080,
            height: 1350,
            pixelRatio: 1,
            skipFonts: true
          });`;

if (content.includes(oldOptions)) {
  content = content.replace(oldOptions, newOptions);
}

// 3. Improve catch block error alert message
const oldCatch = "alert('Erreur lors de la génération des images.');";
const newCatch = "alert(`Erreur lors de la génération des images : ${error.message || error}`);";

if (content.includes(oldCatch)) {
  content = content.replace(oldCatch, newCatch);
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Updated handleDownloadAll & styling successfully!");
