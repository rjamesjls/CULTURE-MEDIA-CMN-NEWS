const fs = require('fs');
const filePath = 'src/app/admin/(dashboard)/reels-studio/ReelsStudioClient.js';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Remove innovate-x, gold-awards, cyber-event canvas drawing logic from drawOverlays
const drawOverlaysRegex = /\/\/\s*4\.\s*INNOVATE-X NEON TEMPLATE[\s\S]*?(?=\/\/\s*3\.\s*MENTIONS)/g;
content = content.replace(drawOverlaysRegex, '');

// Also remove standard/breaking if present in drawOverlays
const standardDrawRegex = /\/\/\s*2\.\s*STANDARD \/ BREAKING TEMPLATE[\s\S]*?(?=\/\/\s*3\.\s*MENTIONS)/g;
content = content.replace(standardDrawRegex, '');

// 2. Remove innovate-x, gold-awards, cyber-event preview overlays
const previewRegex = /\{\/\*\s*(InnovateX Neon|Gold Awards|Cyber Event)\s*Preview Overlay\s*\*\}[\s\S]*?\}\)/g;
content = content.replace(previewRegex, '');

// Remove standard text preview
const standardPreviewRegex = /\{\/\*\s*Standard Text Preview\s*\*\}[\s\S]*?\}\)/g;
content = content.replace(standardPreviewRegex, '');

// 3. Remove sidebar controls for innovate-x, gold-awards, cyber-event, standard
const sidebarControlsRegex = /\{template === '(innovate-x|gold-awards|cyber-event)' && \([\s\S]*?\)\}/g;
content = content.replace(sidebarControlsRegex, '');

// Remove standard text textarea
const standardTextareaRegex = /\{!\[['"]music-promo['"][\s\S]*?\}\)/g;
content = content.replace(standardTextareaRegex, '');

// 4. Clean Template Design <select> to only contain OUT NOW
const selectOldBlock = `<select 
                  value={template} 
                  onChange={(e) => setTemplate(e.target.value)} 
                  className="w-full bg-[#18153a] border border-[#2d295a] text-white rounded-xl p-3 outline-none focus:border-blue-500"
                >
                  <option value="music-promo">🔥 Sortie Musique (OUT NOW)</option>
                  <option value="innovate-x">⚡ InnovateX Neon (Speaker & Eclair 3D - Event/AI)</option>
                  <option value="gold-awards">👑 Prestige Gold Awards (Winner / Billboard)</option>
                  <option value="cyber-event">🌐 Cyber Stream 4.0 (Tech / Web3 Event)</option>
                  <option value="standard">Classique (Texte Standard)</option>
                  <option value="breaking">Breaking News (Texte Rouge)</option>
                </select>`;

const selectNewBlock = `<select 
                  value={template} 
                  onChange={(e) => setTemplate(e.target.value)} 
                  className="w-full bg-[#18153a] border border-[#2d295a] text-white rounded-xl p-3 outline-none focus:border-blue-500"
                >
                  <option value="music-promo">🔥 Sortie Musique (OUT NOW)</option>
                </select>`;

if (content.includes(selectOldBlock)) {
  content = content.replace(selectOldBlock, selectNewBlock);
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Cleaned Reels Studio to keep ONLY the OUT NOW template!");
