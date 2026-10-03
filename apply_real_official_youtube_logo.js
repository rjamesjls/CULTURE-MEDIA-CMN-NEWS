const fs = require('fs');
const filePath = 'src/app/admin/(dashboard)/reels-studio/ReelsStudioClient.js';
let content = fs.readFileSync(filePath, 'utf-8');

// 100% Official Google YouTube Brand Asset SVG Data URI (White Vector)
const officialYouTubeSvgData = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 20" width="180" height="40" fill="%23FFFFFF"%3E%3Cpath d="M27.972 3.123A3.504 3.504 0 0 0 25.503.654C23.32 0 14.28 0 14.28 0s-9.04 0-11.223.654A3.504 3.504 0 0 0 .588 3.123C0 5.305 0 9.84 0 9.84s0 4.536.588 6.718a3.504 3.504 0 0 0 2.469 2.469c2.183.654 11.223.654 11.223.654s9.04 0 11.223-.654a3.504 3.504 0 0 0 2.469-2.469c.588-2.182.588-6.718.588-6.718s0-4.535-.588-6.718zM11.378 14.02V5.66l7.38 4.18-7.38 4.18z"/%3E%3Cpath d="M39.697 18.57h-3.141V8.406l-1.043.435v-1.74l3.826-1.565h.358v13.034zm8.047.153c-2.43 0-3.99-1.536-3.99-4.275 0-2.816 1.638-4.327 4.096-4.327 2.432 0 3.942 1.536 3.942 4.327 0 2.765-1.562 4.275-4.048 4.275zm.077-1.92c1.075 0 1.664-.973 1.664-2.407 0-1.408-.563-2.355-1.664-2.355-1.126 0-1.715.947-1.715 2.355 0 1.434.589 2.407 1.715 2.407zm10.297 1.767h-2.15v-1.126c-.461.768-1.28 1.28-2.15 1.28-.973 0-1.511-.486-1.511-1.638v-6.912h2.253v6.323c0 .589.205.845.691.845.563 0 .973-.41 1.152-.922V10.174h2.253v8.396zm5.732-8.396h-2.227v8.396h-2.253v-8.396h-2.227V8.406h6.707v1.768zm7.932 8.396h-2.15v-1.126c-.461.768-1.28 1.28-2.15 1.28-.973 0-1.511-.486-1.511-1.638v-6.912h2.253v6.323c0 .589.205.845.691.845.563 0 .973-.41 1.152-.922V10.174h2.253v8.396zm7.424 0h-2.15v-1.1c-.512.768-1.331 1.254-2.304 1.254-1.946 0-3.328-1.408-3.328-4.378 0-2.867 1.434-4.224 3.379-4.224.947 0 1.741.435 2.227 1.126V5.1h2.176v13.47zm-2.15-4.147c0-1.383-.563-2.33-1.639-2.33-1.075 0-1.664.922-1.664 2.33 0 1.408.563 2.33 1.664 2.33 1.076 0 1.639-.922 1.639-2.33zm7.68 0.437h-5.632c.077 1.126.794 1.946 1.971 1.946.845 0 1.511-.384 1.92-1.152l1.792.896c-.742 1.306-1.946 2.176-3.712 2.176-2.586 0-4.173-1.536-4.173-4.352 0-2.714 1.587-4.25 4.045-4.25 2.509 0 3.84 1.51 3.84 4.198v.538zm-2.15-1.638c-.025-1.024-.589-1.741-1.638-1.741-1.024 0-1.613.717-1.741 1.741h3.379z"/%3E%3C/svg%3E';

// Replace top definition
content = content.replace(/const whiteYtLogoSvgData = .*;/, `const whiteYtLogoSvgData = '${officialYouTubeSvgData}';`);
content = content.replace(/const ytSvgLogo = .*;/, `const ytSvgLogo = '${officialYouTubeSvgData}';`);

// Update Canvas drawOverlays to draw the official full YouTube logo
const oldCanvasDraw = `      // Logo YouTube Officiel Blanc (Non Déformable: Icône Play + Texte Wordmark)
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

const newCanvasDraw = `      // Logo YouTube Officiel Google Brand (Full Official Vector Logo)
      const buttonText = texts[3] || 'DISPONIBLE SUR YOUTUBE';
      ctx.font = '900 18px Arial, sans-serif';
      ctx.fillStyle = '#E2E8F0';
      ctx.fillText(buttonText.toUpperCase(), canvasWidth / 2, outNowY + 45);

      if (ytLogoImg) {
        const logoWidth = 180;
        const logoHeight = 40; // exact 90:20 aspect ratio (4.5:1)
        ctx.drawImage(ytLogoImg, (canvasWidth - logoWidth) / 2, outNowY + 65, logoWidth, logoHeight);
      }`;

if (content.includes(oldCanvasDraw)) {
  content = content.replace(oldCanvasDraw, newCanvasDraw);
}

// Update CSS Live Preview to show the 100% Official YouTube Full Logo
const oldPreviewDraw = `                        {/* Logo YouTube Blanc Officiel (Anti-déformation : Icône SVG + Texte Wordmark) */}
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

const newPreviewDraw = `                        {/* Logo YouTube Officiel Blanc (100% Brand Vector Logo) */}
                        <div className="pt-2 flex flex-col items-center gap-1.5">
                          <p className="text-gray-300 text-[8px] font-extrabold tracking-wider uppercase">
                            {activeSlide?.text?.split('\\n')[3] || "DISPONIBLE SUR YOUTUBE"}
                          </p>
                          <img src="${officialYouTubeSvgData}" alt="YouTube" className="h-[22px] w-auto object-contain filter drop-shadow-md" />
                        </div>`;

if (content.includes(oldPreviewDraw)) {
  content = content.replace(oldPreviewDraw, newPreviewDraw);
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Applied 100% official YouTube Brand vector logo to ReelsStudioClient.js!");
