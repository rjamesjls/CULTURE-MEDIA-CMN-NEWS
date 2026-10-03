const fs = require('fs');
const filePath = 'src/app/admin/(dashboard)/reels-studio/ReelsStudioClient.js';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Update Canvas drawOverlays to use promoTopTextSize for songTitle font size
const oldCanvasFont = `ctx.font = '900 64px "Arial Black", Impact, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 20;`;

const newCanvasFont = `ctx.font = \`900 \${promoTopTextSize || 64}px "Arial Black", Impact, sans-serif\`;
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 20;`;

if (content.includes(oldCanvasFont)) {
  content = content.replace(oldCanvasFont, newCanvasFont);
}

// 2. Update CSS Live Preview to use promoTopTextSize for song title fontSize
const oldPreviewFont = `<h2 className="text-white font-black text-2xl tracking-tighter uppercase leading-none" style={{ fontFamily: '"Arial Black", Impact, sans-serif' }}>
                          {activeSlide?.text?.split('\\n')[1] || "SONG TITLE"}
                        </h2>`;

const newPreviewFont = `<h2 className="text-white font-black uppercase leading-none" style={{ fontFamily: '"Arial Black", Impact, sans-serif', fontSize: \`\${(promoTopTextSize || 64) * 0.35}px\` }}>
                          {activeSlide?.text?.split('\\n')[1] || "SONG TITLE"}
                        </h2>`;

if (content.includes(oldPreviewFont)) {
  content = content.replace(oldPreviewFont, newPreviewFont);
}

// 3. Rename sidebar label to "Taille du Titre (du morceau)"
content = content.replace(
  '<label className="block text-xs font-bold text-gray-400 mb-2">Taille du Texte 1</label>',
  '<label className="block text-xs font-bold text-gray-400 mb-2">Taille du Titre du morceau</label>'
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Connected promoTopTextSize slider directly to song title size in ReelsStudioClient.js!");
