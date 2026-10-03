const fs = require('fs');
const filePath = 'src/app/admin/(dashboard)/reels-studio/ReelsStudioClient.js';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Update Canvas drawOverlays to draw ONLY YouTube pill button
const oldCanvasLogos = `      // Streaming Platform Logos Bar
      ctx.font = 'bold 22px Arial, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(' Music   ♫ Deezer   ▶ Google Play', canvasWidth / 2, bottomStartY + 95);
      ctx.fillText('≈ TIDAL   ▶ Music   ≈ Spotify', canvasWidth / 2, bottomStartY + 130);
      ctx.fillText(' iTunes   ☁ SoundCloud', canvasWidth / 2, bottomStartY + 165);`;

const newCanvasLogos = `      // YouTube Button Pill (Remplace tous les autres logos)
      const pillWidth = canvasWidth * 0.82;
      const pillHeight = 80;
      const pillX = (canvasWidth - pillWidth) / 2;
      const pillY = outNowY + 35;
      const radius = 40;

      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillWidth, pillHeight, radius);
      ctx.fillStyle = '#FFFFFF'; 
      ctx.fill();

      const buttonText = texts[3] || 'DISPONIBLE SUR YOUTUBE';
      ctx.font = '900 28px "Arial Black", Arial, sans-serif';
      const textWidth = ctx.measureText(buttonText).width;
      const logoWidth = 60;
      const logoHeight = 42;
      const gap = 12;
      
      const contentWidth = ytLogoImg ? logoWidth + gap + textWidth : textWidth;
      const startX = pillX + (pillWidth - contentWidth) / 2;
      
      if (ytLogoImg) {
        ctx.drawImage(ytLogoImg, startX, pillY + (pillHeight - logoHeight) / 2, logoWidth, logoHeight);
      }
      
      ctx.textAlign = 'left';
      ctx.fillStyle = '#000000';
      ctx.fillText(buttonText, ytLogoImg ? startX + logoWidth + gap : startX, pillY + 52);`;

if (content.includes(oldCanvasLogos)) {
  content = content.replace(oldCanvasLogos, newCanvasLogos);
}

// 2. Update CSS Live Preview to show ONLY the YouTube pill button
const oldPreviewLogos = `                        {/* Streaming Logos Grid Bar */}
                        <div className="pt-1 border-t border-white/20 text-white text-[8px] font-bold space-y-0.5 tracking-wide">
                          <div className="flex justify-center gap-2">
                            <span> Music</span>
                            <span>♫ Deezer</span>
                            <span>▶ Google Play</span>
                          </div>
                          <div className="flex justify-center gap-2">
                            <span>≈ TIDAL</span>
                            <span>▶ Music</span>
                            <span>≈ Spotify</span>
                          </div>
                          <div className="flex justify-center gap-2">
                            <span> iTunes</span>
                            <span>☁ SoundCloud</span>
                          </div>
                        </div>`;

const newPreviewLogos = `                        {/* YouTube Pill Button (Unique Logo) */}
                        <div className="pt-2 flex justify-center">
                          <div className="w-[88%] bg-white rounded-full flex justify-center items-center p-2 shadow-2xl overflow-hidden relative" style={{ height: '40px' }}>
                            <div className="flex items-center gap-2">
                              <img src='data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"%3E%3Cpath fill="%23FF0000" d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z"/%3E%3C/svg%3E' alt="YT" className="h-[22px]" />
                              <span className="text-black font-black text-[10px] tracking-tight whitespace-nowrap" style={{fontFamily: '"Arial Black", Arial, sans-serif'}}>{activeSlide?.text?.split('\\n')[3] || 'DISPONIBLE SUR YOUTUBE'}</span>
                            </div>
                          </div>
                        </div>`;

if (content.includes(oldPreviewLogos)) {
  content = content.replace(oldPreviewLogos, newPreviewLogos);
}

// 3. Update Textarea helper instructions in sidebar
content = content.replace(
  "<p>Ligne 4 : Sous-titre plateformes (ex: AVAILABLE ON ALL STREAMING PLATFORMS.)</p>",
  "<p>Ligne 4 : Texte du bouton YouTube (ex: DISPONIBLE SUR YOUTUBE)</p>"
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Replaced all other logos with ONLY YouTube logo button in ReelsStudioClient.js!");
