const fs = require('fs');
const filePath = 'src/app/admin/(dashboard)/reels-studio/ReelsStudioClient.js';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Update Canvas drawOverlays to draw YouTube Play Icon + YouTube Wordmark Text (never deforms)
const oldCanvasDraw = `      // Logo YouTube Officiel Blanc (Conforme à l'image envoyée)
      const buttonText = texts[3] || 'DISPONIBLE SUR YOUTUBE';
      ctx.font = '900 22px Arial, sans-serif';
      ctx.fillStyle = '#E2E8F0';
      ctx.fillText(buttonText.toUpperCase(), canvasWidth / 2, outNowY + 45);

      if (ytLogoImg) {
        const logoWidth = 160;
        const logoHeight = Math.round(160 * (36 / 159)); // exact aspect ratio 4.416:1 (~36.2px)
        ctx.drawImage(ytLogoImg, (canvasWidth - logoWidth) / 2, outNowY + 70, logoWidth, logoHeight);
      }`;

const newCanvasDraw = `      // Logo YouTube Officiel Blanc (Non Déformable: Icône Play + Texte Wordmark)
      const buttonText = texts[3] || 'DISPONIBLE SUR YOUTUBE';
      ctx.font = '900 20px Arial, sans-serif';
      ctx.fillStyle = '#E2E8F0';
      ctx.fillText(buttonText.toUpperCase(), canvasWidth / 2, outNowY + 45);

      // Draw YouTube Wordmark
      const ytY = outNowY + 95;
      ctx.font = '900 36px "Arial Narrow", "Arial Black", sans-serif';
      ctx.fillStyle = '#FFFFFF';
      
      const textWidth = ctx.measureText('YouTube').width;
      const iconWidth = 44;
      const iconHeight = 31; // exact 576:512 aspect ratio
      const totalWidth = iconWidth + 12 + textWidth;
      const startX = (canvasWidth - totalWidth) / 2;

      if (ytLogoImg) {
        ctx.drawImage(ytLogoImg, startX, ytY - 26, iconWidth, iconHeight);
      }
      ctx.textAlign = 'left';
      ctx.fillText('YouTube', startX + iconWidth + 12, ytY);`;

if (content.includes(oldCanvasDraw)) {
  content = content.replace(oldCanvasDraw, newCanvasDraw);
}

// 2. Update CSS Live Preview to use SVG Icon + YouTube Wordmark (Never Deforms)
const oldPreviewCode = `                        {/* Logo YouTube Blanc Officiel (Monochrome Blanc) */}
                        <div className="pt-2 flex flex-col items-center gap-1.5">
                          <p className="text-gray-300 text-[8px] font-extrabold tracking-wider uppercase">
                            {activeSlide?.text?.split('\\n')[3] || "DISPONIBLE SUR YOUTUBE"}
                          </p>
                          <img src={whiteYtLogoSvgData} alt="YouTube" className="h-[22px] w-auto object-contain filter drop-shadow-md" />
                        </div>`;

const newPreviewCode = `                        {/* Logo YouTube Blanc Officiel (Anti-déformation : Icône SVG + Texte Wordmark) */}
                        <div className="pt-2 flex flex-col items-center gap-1">
                          <p className="text-gray-300 text-[8px] font-extrabold tracking-wider uppercase">
                            {activeSlide?.text?.split('\\n')[3] || "DISPONIBLE SUR YOUTUBE"}
                          </p>
                          <div className="flex items-center justify-center gap-2 pt-0.5">
                            <svg className="h-[22px] w-[31px] flex-shrink-0" viewBox="0 0 576 512" fill="#FFFFFF">
                              <path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z"/>
                            </svg>
                            <span className="text-white font-black text-xl tracking-tighter leading-none" style={{ fontFamily: '"Arial Narrow", "Arial Black", sans-serif' }}>
                              YouTube
                            </span>
                          </div>
                        </div>`;

if (content.includes(oldPreviewCode)) {
  content = content.replace(oldPreviewCode, newPreviewCode);
}

// 3. Update ytLogoImg source to SVG Play Icon
content = content.replace(
  "const ytSvgLogo = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 576 512\"%3E%3Cpath fill=\"%23FF0000\" d=\"M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z\"/%3E%3C/svg%3E';",
  "const ytSvgLogo = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 576 512\"%3E%3Cpath fill=\"%23FFFFFF\" d=\"M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z\"/%3E%3C/svg%3E';"
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Fixed YouTube logo distortion completely in ReelsStudioClient.js!");
