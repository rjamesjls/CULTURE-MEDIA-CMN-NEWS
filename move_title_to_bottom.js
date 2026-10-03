const fs = require('fs');
const filePath = 'src/app/admin/(dashboard)/reels-studio/ReelsStudioClient.js';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Update Canvas drawOverlays to put SONG TITLE at the bottom
const oldCanvasDraw = `      // Top Subheader
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
      ctx.fillText(platformsText.toUpperCase(), canvasWidth / 2, bottomStartY + 45);`;

const newCanvasDraw = `      // Top Section: OUT NOW / Subheader
      ctx.textAlign = 'center';
      ctx.font = '900 64px "Arial Black", Impact, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 15;
      ctx.fillText(outNowText.toUpperCase(), canvasWidth / 2, 90);
      ctx.shadowBlur = 0;

      ctx.font = 'bold 20px Arial, sans-serif';
      ctx.fillStyle = '#E2E8F0';
      ctx.fillText(subheader.toUpperCase(), canvasWidth / 2, 130);

      // White Border around Center Square Frame (Canvas Video Area)
      const frameSize = canvasWidth * 0.70;
      const frameX = (canvasWidth - frameSize) / 2;
      const frameY = canvasHeight * 0.17;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 8;
      ctx.strokeRect(frameX, frameY, frameSize, frameSize);

      // Bottom Section: TITRE DU MORCEAU (PLANTÉ EN BAS)
      const bottomStartY = frameY + frameSize + 60;
      ctx.font = '900 64px "Arial Black", Impact, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 20;

      const titleLines = songTitle.split(' ');
      if (titleLines.length >= 2) {
        ctx.fillText(titleLines[0].toUpperCase(), canvasWidth / 2, bottomStartY);
        ctx.fillText(titleLines.slice(1).join(' ').toUpperCase(), canvasWidth / 2, bottomStartY + 60);
      } else {
        ctx.fillText(songTitle.toUpperCase(), canvasWidth / 2, bottomStartY + 20);
      }
      ctx.shadowBlur = 0;

      // Streaming Platforms Subtitle
      const offsetY = titleLines.length >= 2 ? 110 : 70;
      ctx.font = '900 16px Arial, sans-serif';
      ctx.fillStyle = '#E2E8F0';
      ctx.fillText(platformsText.toUpperCase(), canvasWidth / 2, bottomStartY + offsetY);`;

if (content.includes(oldCanvasDraw)) {
  content = content.replace(oldCanvasDraw, newCanvasDraw);
}

// 2. Update CSS Live Preview in ReelsStudioClient.js
const oldCssPreview = `{template === 'music-promo' && (
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

const newCssPreview = `{template === 'music-promo' && (
                    <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none" style={{ background: \`linear-gradient(180deg, rgba(10,17,40,\${(promoGradientOpacity || 85)/100}) 0%, rgba(15,23,52,0.4) 40%, rgba(5,10,24,\${(promoGradientOpacity || 85)/100}) 100%)\` }}>
                      
                      {/* Top Header: OUT NOW */}
                      <div className="text-center pt-2">
                        <h2 className="text-white font-black text-3xl tracking-tight uppercase leading-none" style={{ fontFamily: '"Arial Black", Impact, sans-serif' }}>
                          {activeSlide?.text?.split('\\n')[2] || "OUT NOW"}
                        </h2>
                        <p className="text-gray-300 text-[9px] font-black tracking-widest uppercase mt-0.5">
                          {activeSlide?.text?.split('\\n')[0] || "A NEW RELEASE FROM 'ARTIST NAME'"}
                        </p>
                      </div>

                      {/* Center Frame White Border (Wraps video area) */}
                      <div className="my-auto mx-auto w-[82%] aspect-square border-4 border-white rounded-lg shadow-2xl flex items-center justify-center relative overflow-hidden bg-black/20">
                        {!activeSlide?.media && (
                          <span className="text-white/60 font-bold text-xs">Artwork / Video Here</span>
                        )}
                      </div>

                      {/* Bottom Section: TITRE DU MORCEAU (EN BAS) */}
                      <div className="text-center pb-2 space-y-1">
                        <h2 className="text-white font-black text-2xl tracking-tighter uppercase leading-none" style={{ fontFamily: '"Arial Black", Impact, sans-serif' }}>
                          {activeSlide?.text?.split('\\n')[1] || "SONG TITLE"}
                        </h2>
                        <p className="text-gray-300 text-[8px] font-extrabold tracking-wider uppercase">
                          {activeSlide?.text?.split('\\n')[3] || "AVAILABLE ON ALL STREAMING PLATFORMS."}
                        </p>
                        
                        {/* Streaming Logos Grid Bar */}
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
                        </div>
                      </div>
                    </div>
                  )}`;

if (content.includes(oldCssPreview)) {
  content = content.replace(oldCssPreview, newCssPreview);
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Moved SONG TITLE to bottom in ReelsStudioClient.js successfully!");
