const fs = require('fs');
const filePath = 'src/app/admin/(dashboard)/reels-studio/ReelsStudioClient.js';
let content = fs.readFileSync(filePath, 'utf-8');

// Helper to convert hex to rgba
const hexToRgba = (hex, opacity) => {
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Update preview background style to dynamically reflect promoGradientOpacity and promoGradientColor
const oldPreviewStyle = `style={{ background: \`linear-gradient(to bottom, rgba(0,0,0,0) 30%, \${promoGradientColor} 80%)\` }}`;
const newPreviewStyle = `style={{ background: \`linear-gradient(to bottom, rgba(0,0,0,0) 30%, rgba(0,0,0,\${(promoGradientOpacity / 100) * 0.5}) 60%, \${promoGradientColor} \${promoGradientOpacity}%)\` }}`;

if (content.includes(oldPreviewStyle)) {
  content = content.replace(oldPreviewStyle, newPreviewStyle);
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Updated ReelsStudioClient.js preview gradient live styling!");
