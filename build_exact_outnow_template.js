const fs = require('fs');
const filePath = 'src/app/admin/(dashboard)/reels-studio/ReelsStudioClient.js';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Update Canvas drawOverlays function to render the exact reference template
const oldDrawOverlaysBlock = `  // --- DRAW OVERLAYS FUNCTION (CANVAS) ---
  const drawOverlays = (ctx, slide, canvasWidth, canvasHeight, ytLogoImg = null) => {
    // 1. MUSIC PROMO TEMPLATE ("OUT NOW")
    if (template === 'music-promo') {
      // Gradient Overlay (bas)
      const hex2rgb = (hex) => {
        const r = parseInt(hex.slice(1, 3), 16) || 0;
        const g = parseInt(hex.slice(3, 5), 16) || 0;
        const b = parseInt(hex.slice(5, 7), 16) || 0;
        return \`\${r},\${g},\${b}\`;
      };
      
      // Overlay Dégradé Sombre en Bas (Optimisé pour lisibilité)
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
      ctx.fillRect(0, canvasHeight * 0.35, canvasWidth, canvasHeight * 0.65);

      const texts = slide.text ? slide.text.split('\\n') : [];
      const topText = texts[0] || 'OUT NOW';
      const titleText = texts[1] || '';
      const artistText = texts[2] || '';
      const buttonText = texts[3] || 'DISPONIBLE SUR YOUTUBE';

      // TEXTE PRINCIPAL (Énorme et en Gras)
      if (topText) {
        ctx.font = \`900 \${promoTopTextSize}px "Arial Black", Arial, sans-serif\`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 20;
        ctx.fillText(topText, canvasWidth / 2, canvasHeight * (promoTopTextY / 100));
        ctx.shadowBlur = 0; // reset
      }

      // TEXTE : Titre / Artiste
      if (titleText || artistText) {
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 10;
        
        if (titleText) {
          ctx.font = 'bold 50px Arial, sans-serif';
          ctx.fillStyle = '#f3f4f6';
          ctx.fillText(titleText, canvasWidth / 2, canvasHeight * 0.63);
        }
        
        if (artistText) {
          ctx.font = 'italic 40px Arial, sans-serif';
          ctx.fillStyle = '#d1d5db';
          ctx.fillText(artistText, canvasWidth / 2, canvasHeight * 0.68);
        }
        ctx.shadowBlur = 0;
      }

      // TEXTE : BOUTON YOUTUBE + LOGO
      const pillWidth = canvasWidth * 0.85;
      const pillHeight = 90;
      const pillX = (canvasWidth - pillWidth) / 2;
      const pillY = canvasHeight * 0.85;
      const radius = 45;

      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillWidth, pillHeight, radius);
      ctx.fillStyle = '#ffffff'; 
      ctx.fill();

      // Centering Content in Pill
      ctx.font = '900 32px "Arial Black", Arial, sans-serif';
      const textWidth = ctx.measureText(buttonText).width;
      const logoWidth = 70;
      const logoHeight = 50;
      const gap = 15;
      
      const contentWidth = ytLogoImg ? logoWidth + gap + textWidth : textWidth;
      const startX = pillX + (pillWidth - contentWidth) / 2;
      
      if (ytLogoImg) {
        ctx.drawImage(ytLogoImg, startX, pillY + (pillHeight - logoHeight) / 2, logoWidth, logoHeight);
      }
      
      ctx.textAlign = 'left';
      ctx.fillStyle = '#000000';
      ctx.fillText(buttonText, ytLogoImg ? startX + logoWidth + gap : startX, pillY + 58);

    }`;

const newDrawOverlaysBlock = `  // --- DRAW OVERLAYS FUNCTION (CANVAS) ---
  const drawOverlays = (ctx, slide, canvasWidth, canvasHeight, ytLogoImg = null) => {
    if (template === 'music-promo') {
      const hex2rgb = (hex) => {
        const r = parseInt(hex.slice(1, 3), 16) || 0;
        const g = parseInt(hex.slice(3, 5), 16) || 0;
        const b = parseInt(hex.slice(5, 7), 16) || 0;
        return \`\${r},\${g},\${b}\`;
      };
      
      const opacityFrac = (promoGradientOpacity || 85) / 100;

      // Dark Navy Background Overlay
      const grad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
      grad.addColorStop(0, \`rgba(10, 17, 40, \${0.7 * opacityFrac})\`);
      grad.addColorStop(0.5, \`rgba(15, 23, 52, \${0.5 * opacityFrac})\`);
      grad.addColorStop(1, \`rgba(5, 10, 24, \${0.95 * opacityFrac})\`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      const texts = slide.text ? slide.text.split('\\n') : [];
      const subheader = texts[0] || "A NEW RELEASE FROM 'ARTIST NAME'";
      const songTitle = texts[1] || "SONG TITLE";
      const outNowText = texts[2] || "OUT NOW";
      const platformsText = texts[3] || "AVAILABLE ON ALL STREAMING PLATFORMS.";

      // Top Subheader
      ctx.textAlign = 'center';
      ctx.font = '900 24px Arial, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(subheader.toUpperCase(), canvasWidth / 2, 70);

      // Huge Song Title (splits into 2 lines if needed)
      ctx.font = '900 68px "Arial Black", Impact, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 20;

      const titleLines = songTitle.split(' ');
      if (titleLines.length >= 2) {
        ctx.fillText(titleLines[0].toUpperCase(), canvasWidth / 2, 140);
        ctx.fillText(titleLines.slice(1).join(' ').toUpperCase(), canvasWidth / 2, 210);
      } else {
        ctx.fillText(songTitle.toUpperCase(), canvasWidth / 2, 160);
      }
      ctx.shadowBlur = 0;

      // White Border around Center Square Frame (Canvas Video Area)
      const frameSize = canvasWidth * 0.72;
      const frameX = (canvasWidth - frameSize) / 2;
      const frameY = canvasHeight * 0.24;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 8;
      ctx.strokeRect(frameX, frameY, frameSize, frameSize);

      // Bottom Section: OUT NOW
      const bottomStartY = frameY + frameSize + 50;
      ctx.font = '900 72px "Arial Black", Impact, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(outNowText.toUpperCase(), canvasWidth / 2, bottomStartY);

      // Streaming Platforms Subtitle
      ctx.font = '900 18px Arial, sans-serif';
      ctx.fillStyle = '#E2E8F0';
      ctx.fillText(platformsText.toUpperCase(), canvasWidth / 2, bottomStartY + 45);

      // Streaming Platform Logos Bar
      ctx.font = 'bold 22px Arial, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(' Music   ♫ Deezer   ▶ Google Play', canvasWidth / 2, bottomStartY + 95);
      ctx.fillText('≈ TIDAL   ▶ Music   ≈ Spotify', canvasWidth / 2, bottomStartY + 130);
      ctx.fillText(' iTunes   ☁ SoundCloud', canvasWidth / 2, bottomStartY + 165);
    }`;

if (content.includes(oldDrawOverlaysBlock)) {
  content = content.replace(oldDrawOverlaysBlock, newDrawOverlaysBlock);
}

// 2. Update CSS Live Preview in ReelsStudioClient.js to match the reference poster
const oldCssPreviewBlock = `{template === 'music-promo' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-end pb-[15%] pointer-events-none" style={{ background: \`linear-gradient(to bottom, rgba(0,0,0,0) 30%, rgba(0,0,0,\${(promoGradientOpacity / 100) * 0.5}) 60%, \${promoGradientColor} \${promoGradientOpacity}%)\` }}>
                      
                      {/* Top Text (OUT NOW) */}
                      <div className="absolute w-full" style={{ top: \`\${promoTopTextY}%\`, transform: 'translateY(-100%)' }}>
                        <h2 className="font-black text-white leading-none shadow-2xl text-center w-full" style={{fontFamily: '"Arial Black", Arial, sans-serif', textShadow: '0 4px 20px rgba(0,0,0,0.8)', fontSize: \`\${promoTopTextSize * 0.3}px\`}}>
                          {activeSlide?.text?.split('\\n')[0] || 'OUT NOW'}
                        </h2>
                      </div>
                      
                      {/* Title & Artist */}
                      <div className="absolute w-full" style={{ top: '63%', transform: 'translateY(-100%)' }}>
                        <div className="text-center mt-2 w-full px-4" style={{textShadow: '0 4px 10px rgba(0,0,0,0.8)'}}>
                          <p className="text-xl font-bold text-[#f3f4f6] truncate">{activeSlide?.text?.split('\\n')[1] || ''}</p>
                          <p className="text-md italic text-[#d1d5db] truncate">{activeSlide?.text?.split('\\n')[2] || ''}</p>
                        </div>
                      </div>
                      
                      {/* Youtube Pill Preview */}
                      <div className="w-[90%] bg-white rounded-full flex justify-center items-center p-2 shadow-2xl shadow-black/50 overflow-hidden relative" style={{ height: '45px' }}>
                        <div className="flex items-center gap-2">
                          <img src='data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"%3E%3Cpath fill="%23FF0000" d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z"/%3E%3C/svg%3E' alt="YT" className="h-[25px]" />
                          <span className="text-black font-black text-[11px] tracking-tight whitespace-nowrap" style={{fontFamily: '"Arial Black", Arial, sans-serif'}}>{activeSlide?.text?.split('\\n')[3] || 'DISPONIBLE SUR YOUTUBE'}</span>
                        </div>
                      </div>
                    </div>
                  )}`;

const newCssPreviewBlock = `{template === 'music-promo' && (
                    <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none" style={{ background: \`linear-gradient(180deg, rgba(10,17,40,\${(promoGradientOpacity || 85)/100}) 0%, rgba(15,23,52,0.4) 40%, rgba(5,10,24,\${(promoGradientOpacity || 85)/100}) 100%)\` }}>
                      
                      {/* Top Header */}
                      <div className="text-center pt-2">
                        <p className="text-white text-[10px] font-black tracking-widest uppercase mb-1">
                          {activeSlide?.text?.split('\\n')[0] || "A NEW RELEASE FROM 'ARTIST NAME'"}
                        </p>
                        <h2 className="text-white font-black text-2xl tracking-tighter uppercase leading-none" style={{ fontFamily: '"Arial Black", Impact, sans-serif' }}>
                          {activeSlide?.text?.split('\\n')[1] || "SONG TITLE"}
                        </h2>
                      </div>

                      {/* Center Frame White Border (Wraps video area) */}
                      <div className="my-auto mx-auto w-[82%] aspect-square border-4 border-white rounded-lg shadow-2xl flex items-center justify-center relative overflow-hidden bg-black/20">
                        {!activeSlide?.media && (
                          <span className="text-white/60 font-bold text-sm">Artwork / Video Here</span>
                        )}
                      </div>

                      {/* Bottom OUT NOW & Streaming Platforms Bar */}
                      <div className="text-center pb-2 space-y-1">
                        <h2 className="text-white font-black text-3xl tracking-tight uppercase leading-none" style={{ fontFamily: '"Arial Black", Impact, sans-serif' }}>
                          {activeSlide?.text?.split('\\n')[2] || "OUT NOW"}
                        </h2>
                        <p className="text-gray-300 text-[9px] font-extrabold tracking-wider uppercase">
                          {activeSlide?.text?.split('\\n')[3] || "AVAILABLE ON ALL STREAMING PLATFORMS."}
                        </p>
                        
                        {/* Streaming Logos Grid Bar */}
                        <div className="pt-1 border-t border-white/20 text-white text-[9px] font-bold space-y-0.5 tracking-wide">
                          <div className="flex justify-center gap-3">
                            <span> Music</span>
                            <span>♫ Deezer</span>
                            <span>▶ Google Play</span>
                          </div>
                          <div className="flex justify-center gap-3">
                            <span>≈ TIDAL</span>
                            <span>▶ Music</span>
                            <span>≈ Spotify</span>
                          </div>
                          <div className="flex justify-center gap-3">
                            <span> iTunes</span>
                            <span>☁ SoundCloud</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}`;

if (content.includes(oldCssPreviewBlock)) {
  content = content.replace(oldCssPreviewBlock, newCssPreviewBlock);
}

// 3. Update Textarea Helper Text in Sidebar
const oldTextareaHelper = `<div className="text-xs text-gray-500 mb-2 space-y-1">
                      <p>Ligne 1 : Texte principal (ex: OUT NOW)</p>
                      <p>Ligne 2 : Titre du morceau</p>
                      <p>Ligne 3 : Nom de l'artiste</p>
                      <p>Ligne 4 : Texte du bouton</p>
                    </div>`;

const newTextareaHelper = `<div className="text-xs text-gray-500 mb-2 space-y-1">
                      <p>Ligne 1 : En-tête (ex: A NEW RELEASE FROM 'ARTIST NAME')</p>
                      <p>Ligne 2 : Titre du morceau (ex: SONG TITLE)</p>
                      <p>Ligne 3 : Grand Titre bas (ex: OUT NOW)</p>
                      <p>Ligne 4 : Sous-titre plateformes (ex: AVAILABLE ON ALL STREAMING PLATFORMS.)</p>
                    </div>`;

if (content.includes(oldTextareaHelper)) {
  content = content.replace(oldTextareaHelper, newTextareaHelper);
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Built exact OUT NOW reference template in ReelsStudioClient.js!");
