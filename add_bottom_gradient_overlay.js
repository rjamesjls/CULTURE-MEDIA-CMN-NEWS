const fs = require('fs');

// 1. Update ReelsStudioClient.js
const reelsFile = 'src/app/admin/(dashboard)/reels-studio/ReelsStudioClient.js';
let reelsContent = fs.readFileSync(reelsFile, 'utf-8');

// Add promoGradientOpacity state if not present
if (!reelsContent.includes('const [promoGradientOpacity, setPromoGradientOpacity]')) {
  reelsContent = reelsContent.replace(
    "const [promoGradientColor, setPromoGradientColor] = useState('#000000');",
    "const [promoGradientColor, setPromoGradientColor] = useState('#000000');\n  const [promoGradientOpacity, setPromoGradientOpacity] = useState(85); // % opacity"
  );
}

// Enhance drawOverlays in ReelsStudioClient.js
const oldDrawGradient = `      const gradient = ctx.createLinearGradient(0, canvasHeight * 0.3, 0, canvasHeight);
      gradient.addColorStop(0, \`rgba(\${hex2rgb(promoGradientColor)}, 0)\`);
      gradient.addColorStop(0.5, \`rgba(\${hex2rgb(promoGradientColor)}, 0.7)\`);
      gradient.addColorStop(1, \`rgba(\${hex2rgb(promoGradientColor)}, 1)\`);
      
      // Assombrir très légèrement le haut, et appliquer le dégradé en bas
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight * 0.3);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, canvasHeight * 0.3, canvasWidth, canvasHeight * 0.7);`;

const newDrawGradient = `      // Overlay Dégradé Sombre en Bas (Optimisé pour lisibilité)
      const opacityFrac = (promoGradientOpacity || 85) / 100;
      const gradient = ctx.createLinearGradient(0, canvasHeight * 0.35, 0, canvasHeight);
      gradient.addColorStop(0, \`rgba(\${hex2rgb(promoGradientColor)}, 0)\`);
      gradient.addColorStop(0.5, \`rgba(\${hex2rgb(promoGradientColor)}, \${0.6 * opacityFrac})\`);
      gradient.addColorStop(1, \`rgba(\${hex2rgb(promoGradientColor)}, \${1 * opacityFrac})\`);
      
      // Fond assombri en haut
      ctx.fillStyle = \`rgba(0, 0, 0, \${0.25 * opacityFrac})\`;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight * 0.35);
      
      // Dégradé en bas
      ctx.fillStyle = gradient;
      ctx.fillRect(0, canvasHeight * 0.35, canvasWidth, canvasHeight * 0.65);`;

if (reelsContent.includes(oldDrawGradient)) {
  reelsContent = reelsContent.replace(oldDrawGradient, newDrawGradient);
}

// Add opacity slider control in ReelsStudioClient.js sidebar
const oldGradientControl = `<div>
                    <label className="block text-xs font-bold text-gray-400 mb-2">Couleur du dégradé (Bas)</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="color" 
                        value={promoGradientColor} 
                        onChange={(e) => setPromoGradientColor(e.target.value)}
                        className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-0"
                      />
                      <span className="text-sm font-mono text-gray-400 uppercase">{promoGradientColor}</span>
                    </div>
                  </div>`;

const newGradientControl = `<div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-2">Couleur du dégradé (Bas)</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={promoGradientColor} 
                          onChange={(e) => setPromoGradientColor(e.target.value)}
                          className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                        />
                        <span className="text-xs font-mono text-gray-400 uppercase">{promoGradientColor}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-2">Opacité du Dégradé en bas ({promoGradientOpacity}%)</label>
                      <input 
                        type="range" min="0" max="100" value={promoGradientOpacity}
                        onChange={(e) => setPromoGradientOpacity(parseInt(e.target.value))}
                        className="w-full accent-blue-500"
                      />
                    </div>
                  </div>`;

if (reelsContent.includes(oldGradientControl)) {
  reelsContent = reelsContent.replace(oldGradientControl, newGradientControl);
}

fs.writeFileSync(reelsFile, reelsContent, 'utf-8');
console.log("Updated ReelsStudioClient.js with Bottom Gradient Overlay controls!");

// 2. Update InstagramCustomClient.js with Bottom Gradient Overlay toggle
const instaFile = 'src/app/admin/(dashboard)/instagram/custom/InstagramCustomClient.js';
let instaContent = fs.readFileSync(instaFile, 'utf-8');

// Insert Bottom Gradient Overlay layer in InstagramCustomClient.js
const bottomGradientLayer = `
            {/* Overlay Dégradé Sombre en Bas */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '50%',
              background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
              pointerEvents: 'none',
              zIndex: 5
            }} />`;

if (!instaContent.includes('Overlay Dégradé Sombre en Bas')) {
  instaContent = instaContent.replaceAll(
    "{/* Footer */}\n            <div style={{ borderTop:",
    bottomGradientLayer + "\n\n            {/* Footer */}\n            <div style={{ borderTop:"
  );
  fs.writeFileSync(instaFile, instaContent, 'utf-8');
  console.log("Updated InstagramCustomClient.js with Bottom Gradient Overlay!");
}
