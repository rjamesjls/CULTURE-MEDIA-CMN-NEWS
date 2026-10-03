const fs = require('fs');

// Copy exact user file media_1786352046435.png to public/youtube-user-logo.png
const srcPath = '/Users/studiojls/.gemini/antigravity/brain/9d831544-f280-47a4-a9f1-0757b76be07a/.user_uploaded/media_1786352046435.png';
const destPath = 'public/youtube-user-logo.png';

fs.copyFileSync(srcPath, destPath);
console.log("Successfully copied user uploaded file to public/youtube-user-logo.png!");

// Update ReelsStudioClient.js
const jsPath = 'src/app/admin/(dashboard)/reels-studio/ReelsStudioClient.js';
let content = fs.readFileSync(jsPath, 'utf-8');

// Update ytSvgLogo declaration
content = content.replace(
  /const ytSvgLogo = .*/,
  "const ytSvgLogo = '/youtube-user-logo.png';"
);

// Update Canvas drawOverlays
const oldCanvasDraw = `      // Logo YouTube Officiel Google Brand (Full Official Vector Logo)
      const buttonText = texts[3] || 'DISPONIBLE SUR YOUTUBE';
      ctx.font = '900 18px Arial, sans-serif';
      ctx.fillStyle = '#E2E8F0';
      ctx.fillText(buttonText.toUpperCase(), canvasWidth / 2, outNowY + 45);

      if (ytLogoImg) {
        const logoWidth = 180;
        const logoHeight = 40; // exact 90:20 aspect ratio (4.5:1)
        ctx.drawImage(ytLogoImg, (canvasWidth - logoWidth) / 2, outNowY + 65, logoWidth, logoHeight);
      }`;

const newCanvasDraw = `      // Logo YouTube Exact depuis le Fichier de l'Utilisateur
      const buttonText = texts[3] || 'DISPONIBLE SUR YOUTUBE';
      ctx.font = '900 18px Arial, sans-serif';
      ctx.fillStyle = '#E2E8F0';
      ctx.fillText(buttonText.toUpperCase(), canvasWidth / 2, outNowY + 45);

      if (ytLogoImg) {
        const logoWidth = 190;
        const logoHeight = 190; // 1:1 image square matching user file
        ctx.save();
        ctx.globalCompositeOperation = 'screen'; // Removes black background, leaves pure white logo
        ctx.drawImage(ytLogoImg, (canvasWidth - logoWidth) / 2, outNowY + 10, logoWidth, logoHeight);
        ctx.restore();
      }`;

if (content.includes(oldCanvasDraw)) {
  content = content.replace(oldCanvasDraw, newCanvasDraw);
}

// Update CSS Live Preview
const oldPreviewDraw = `                        {/* Logo YouTube Officiel Blanc (100% Brand Vector Logo) */}
                        <div className="pt-2 flex flex-col items-center gap-1.5">
                          <p className="text-gray-300 text-[8px] font-extrabold tracking-wider uppercase">
                            {activeSlide?.text?.split('\\n')[3] || "DISPONIBLE SUR YOUTUBE"}
                          </p>
                          <img src={whiteYtLogoSvgData} alt="YouTube" className="h-[22px] w-auto object-contain filter drop-shadow-md" />
                        </div>`;

const newPreviewDraw = `                        {/* Logo YouTube Exact du Fichier Fourni par l'Utilisateur */}
                        <div className="pt-1 flex flex-col items-center">
                          <p className="text-gray-300 text-[8px] font-extrabold tracking-wider uppercase mb-[-14px]">
                            {activeSlide?.text?.split('\\n')[3] || "DISPONIBLE SUR YOUTUBE"}
                          </p>
                          <img 
                            src="/youtube-user-logo.png" 
                            alt="YouTube" 
                            className="h-[70px] w-auto object-contain" 
                            style={{ mixBlendMode: 'screen' }} 
                          />
                        </div>`;

if (content.includes(oldPreviewDraw)) {
  content = content.replace(oldPreviewDraw, newPreviewDraw);
}

fs.writeFileSync(jsPath, content, 'utf-8');
console.log("Successfully updated ReelsStudioClient.js to use exact user uploaded file!");
