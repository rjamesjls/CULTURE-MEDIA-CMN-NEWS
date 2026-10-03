const fs = require('fs');
const filePath = 'src/app/admin/(dashboard)/reels-studio/ReelsStudioClient.js';
let content = fs.readFileSync(filePath, 'utf-8');

// White Monochrome YouTube Logo Data URI (matches reference image exactly)
const whiteYtLogoSvgData = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 159 36" fill="%23FFFFFF"%3E%3Cpath d="M34.8 3.9C33.6 2.7 31.9 2 29.8 2H6.2C4.1 2 2.4 2.7 1.2 3.9 0.4 4.7 0 5.8 0 7.2v21.6c0 1.4.4 2.5 1.2 3.3 1.2 1.2 2.9 1.9 5 1.9h23.6c2.1 0 3.8-.7 5-1.9.8-.8 1.2-1.9 1.2-3.3V7.2c0-1.4-.4-2.5-1.2-3.3zM14.5 24.5V11.5L25.8 18l-11.3 6.5z"/%3E%3Cpath d="M49.6 24.2l-5.6-14.8h3.8l3.6 10.4 3.7-10.4h3.8L53.3 24.2v6.6h-3.7v-6.6zM69.3 22.4c0 1.8-.3 3.1-1 4.1-.7 1-1.7 1.5-3 1.5s-2.3-.5-3-1.5c-.7-1-1-2.3-1-4.1v-4.4c0-1.8.3-3.1 1-4.1.7-1 1.7-1.5 3-1.5s2.3.5 3 1.5c.7 1 1 2.3 1 4.1v4.4zm-3.6-4.9c0-1.1-.1-1.9-.3-2.4-.2-.5-.6-.7-1.1-.7s-.9.2-1.1.7c-.2.5-.3 1.3-.3 2.4v5.4c0 1.1.1 1.9.3 2.4.2.5.6.7 1.1.7s.9-.2 1.1-.7c.2-.5.3-1.3.3-2.4v-5.4zM80.8 30.8h-3.4v-2.3c-.6.9-1.4 1.4-2.5 1.4-1 0-1.7-.4-2.1-1.1-.4-.7-.6-1.8-.6-3.3V12.7h3.6v12.2c0 .8.1 1.3.3 1.6.2.3.5.5.9.5s.9-.2 1.2-.7c.3-.5.5-1.2.5-2.2V12.7h3.6v18.1zM93.3 15.6h-3.7V30.8h-3.6V15.6h-3.7v-2.9h11v2.9zM104.5 30.8h-3.4v-2.3c-.6.9-1.4 1.4-2.5 1.4-1 0-1.7-.4-2.1-1.1-.4-.7-.6-1.8-.6-3.3V12.7h3.6v12.2c0 .8.1 1.3.3 1.6.2.3.5.5.9.5s.9-.2 1.2-.7c.3-.5.5-1.2.5-2.2V12.7h3.6v18.1zM116.9 22c0 2.8-.4 4.8-1.1 6.1-.7 1.3-1.9 1.9-3.5 1.9-1.2 0-2.2-.4-2.9-1.2v1.2h-3.4V9.4h3.4v5.9c.7-.8 1.6-1.2 2.8-1.2 1.6 0 2.8.6 3.5 1.9.7 1.3 1.2 3.3 1.2 6zm-3.6-.5c0-1.3-.1-2.2-.3-2.8-.2-.6-.6-.9-1.2-.9s-1 .3-1.3.9c-.3.6-.4 1.5-.4 2.8v1.6c0 1.3.1 2.2.4 2.8.3.6.7.9 1.3.9.6 0 1-.3 1.2-.9.2-.6.3-1.5.3-2.8v-1.6zM128.9 22.8h-6.2c0 1.1.2 1.9.5 2.4.3.5.8.8 1.5.8.9 0 1.6-.4 2.1-1.3l2.8 1.4c-.6 1.2-1.3 2.1-2.2 2.7-.9.6-2.1.9-3.7.9-2.1 0-3.6-.6-4.5-1.9-.9-1.3-1.4-3.2-1.4-5.7 0-2.4.5-4.3 1.4-5.6.9-1.3 2.3-2 4.1-2 1.7 0 3 .6 3.8 1.8.8 1.2 1.2 3 1.2 5.3v1.2zm-3.4-2.5c0-.9-.2-1.6-.5-2.1-.3-.5-.7-.7-1.3-.7-.6 0-1 .2-1.3.7-.3.5-.5 1.2-.5 2.1h3.6z"/%3E%3C/svg%3E';

// 1. Update Canvas drawOverlays to render the Monochrome White YouTube logo
const oldCanvasPill = `      // YouTube Button Pill (Remplace tous les autres logos)
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

const newCanvasPill = `      // Logo YouTube Officiel Blanc (Conforme à l'image envoyée)
      const buttonText = texts[3] || 'DISPONIBLE SUR YOUTUBE';
      ctx.font = '900 22px Arial, sans-serif';
      ctx.fillStyle = '#E2E8F0';
      ctx.fillText(buttonText.toUpperCase(), canvasWidth / 2, outNowY + 45);

      if (ytLogoImg) {
        const logoWidth = 140;
        const logoHeight = 32;
        ctx.drawImage(ytLogoImg, (canvasWidth - logoWidth) / 2, outNowY + 70, logoWidth, logoHeight);
      }`;

if (content.includes(oldCanvasPill)) {
  content = content.replace(oldCanvasPill, newCanvasPill);
}

// 2. Update CSS Live Preview to render the Monochrome White YouTube logo
const oldPreviewPill = `                        {/* YouTube Pill Button (Unique Logo) */}
                        <div className="pt-2 flex justify-center">
                          <div className="w-[88%] bg-white rounded-full flex justify-center items-center p-2 shadow-2xl overflow-hidden relative" style={{ height: '40px' }}>
                            <div className="flex items-center gap-2">
                              <img src='data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"%3E%3Cpath fill="%23FF0000" d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z"/%3E%3C/svg%3E' alt="YT" className="h-[22px]" />
                              <span className="text-black font-black text-[10px] tracking-tight whitespace-nowrap" style={{fontFamily: '"Arial Black", Arial, sans-serif'}}>{activeSlide?.text?.split('\\n')[3] || 'DISPONIBLE SUR YOUTUBE'}</span>
                            </div>
                          </div>
                        </div>`;

const newPreviewPill = `                        {/* Logo YouTube Blanc Officiel (Monochrome Blanc) */}
                        <div className="pt-2 flex flex-col items-center gap-1.5">
                          <p className="text-gray-300 text-[8px] font-extrabold tracking-wider uppercase">
                            {activeSlide?.text?.split('\\n')[3] || "DISPONIBLE SUR YOUTUBE"}
                          </p>
                          <img src="${whiteYtLogoSvgData}" alt="YouTube" className="h-[20px] filter drop-shadow-md" />
                        </div>`;

if (content.includes(oldPreviewPill)) {
  content = content.replace(oldPreviewPill, newPreviewPill);
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Updated YouTube logo to Monochrome White SVG in ReelsStudioClient.js successfully!");
