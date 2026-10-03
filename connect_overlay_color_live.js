const fs = require('fs');
const filePath = 'src/app/admin/(dashboard)/reels-studio/ReelsStudioClient.js';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Change initial state default to #0B132B
content = content.replace(
  "const [promoGradientColor, setPromoGradientColor] = useState('#000000');",
  "const [promoGradientColor, setPromoGradientColor] = useState('#0B132B');"
);

// 2. Add hex2rgbStr helper before drawOverlays
const helperFunc = `
// Helper to convert hex color to rgba string
const hex2rgbStr = (hex, opacity = 1) => {
  if (!hex || hex[0] !== '#') return \`rgba(10, 17, 40, \${opacity})\`;
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  return \`rgba(\${r}, \${g}, \${b}, \${opacity})\`;
};
`;

if (!content.includes('const hex2rgbStr =')) {
  content = content.replace('const drawOverlays =', helperFunc + '\n  const drawOverlays =');
}

// 3. Update drawOverlays in ReelsStudioClient.js to use promoGradientColor
const oldCanvasGrad = `      // Dark Navy Background Overlay
      const grad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
      grad.addColorStop(0, \`rgba(10, 17, 40, \${0.7 * opacityFrac})\`);
      grad.addColorStop(0.5, \`rgba(15, 23, 52, \${0.5 * opacityFrac})\`);
      grad.addColorStop(1, \`rgba(5, 10, 24, \${0.95 * opacityFrac})\`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);`;

const newCanvasGrad = `      // Background Gradient Overlay (Dynamic promoGradientColor)
      const grad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
      grad.addColorStop(0, hex2rgbStr(promoGradientColor, 0.85 * opacityFrac));
      grad.addColorStop(0.5, hex2rgbStr(promoGradientColor, 0.45 * opacityFrac));
      grad.addColorStop(1, hex2rgbStr(promoGradientColor, 0.95 * opacityFrac));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);`;

if (content.includes(oldCanvasGrad)) {
  content = content.replace(oldCanvasGrad, newCanvasGrad);
}

// 4. Update CSS Live Preview in ReelsStudioClient.js to use promoGradientColor
const oldPreviewGrad = `style={{ background: \`linear-gradient(180deg, rgba(10,17,40,\${(promoGradientOpacity || 85)/100}) 0%, rgba(15,23,52,0.4) 40%, rgba(5,10,24,\${(promoGradientOpacity || 85)/100}) 100%)\` }}`;

const newPreviewGrad = `style={{ background: \`linear-gradient(180deg, \${hex2rgbStr(promoGradientColor, (promoGradientOpacity || 85)/100)} 0%, \${hex2rgbStr(promoGradientColor, 0.4)} 50%, \${hex2rgbStr(promoGradientColor, (promoGradientOpacity || 85)/100)} 100%)\` }}`;

if (content.includes(oldPreviewGrad)) {
  content = content.replace(oldPreviewGrad, newPreviewGrad);
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Connected promoGradientColor color picker directly to background overlay in ReelsStudioClient.js!");
