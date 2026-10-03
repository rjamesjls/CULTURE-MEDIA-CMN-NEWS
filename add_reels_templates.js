const fs = require('fs');
const filePath = 'src/app/admin/(dashboard)/reels-studio/ReelsStudioClient.js';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add Canvas drawing logic for innovate-x, gold-awards, cyber-event inside drawOverlays
const canvasDrawCode = `    // 4. INNOVATE-X NEON TEMPLATE (SPEAKER & LIGHTNING)
    else if (template === 'innovate-x') {
      const texts = slide.text ? slide.text.split('\\n') : [];
      const topBadge = texts[0] || 'PRESENT InnovateX 2026';
      const mainTitle = texts[1] || 'SHAPING THE FUTURE WITH IDEAS';
      const speakerInfo = texts[2] || 'Speaker Dr. Aminu Yusuf (AI Specialist)';
      const locationText = texts[3] || 'Eko Convention Centre, Lagos';
      const dateText = texts[4] || '15th Nov, 2026';
      const footerLink = texts[5] || 'Register at: www.innovatex.com';

      // Background Gradient Overlay
      const grad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
      grad.addColorStop(0, 'rgba(112, 26, 117, 0.75)');
      grad.addColorStop(0.6, 'rgba(59, 7, 100, 0.85)');
      grad.addColorStop(1, 'rgba(23, 3, 38, 0.95)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Top Badge
      ctx.textAlign = 'center';
      ctx.font = '900 24px Arial, sans-serif';
      ctx.fillStyle = '#E879F9';
      ctx.fillText(topBadge.toUpperCase(), canvasWidth / 2, 120);

      // Main Title
      ctx.font = '900 48px "Arial Black", Arial, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(217,70,239,0.8)';
      ctx.shadowBlur = 25;
      ctx.fillText('⚡ ' + mainTitle.toUpperCase(), canvasWidth / 2, 200);
      ctx.shadowBlur = 0;

      // Speaker Box (Bottom Right)
      if (speakerInfo) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(canvasWidth * 0.45, canvasHeight * 0.65, canvasWidth * 0.5, 110);
        ctx.strokeStyle = 'rgba(217,70,239,0.5)';
        ctx.lineWidth = 3;
        ctx.strokeRect(canvasWidth * 0.45, canvasHeight * 0.65, canvasWidth * 0.5, 110);

        ctx.textAlign = 'right';
        ctx.font = 'bold 22px Arial, sans-serif';
        ctx.fillStyle = '#E879F9';
        ctx.fillText('Speaker', canvasWidth * 0.92, canvasHeight * 0.65 + 35);
        ctx.font = '900 28px Arial, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(speakerInfo, canvasWidth * 0.92, canvasHeight * 0.65 + 75);
      }

      // Location & Date Pills (Bottom)
      const pillY = canvasHeight * 0.84;
      ctx.fillStyle = '#C026D3';
      ctx.beginPath();
      ctx.roundRect(40, pillY, canvasWidth * 0.52, 70, 20);
      ctx.fill();

      ctx.textAlign = 'left';
      ctx.font = 'bold 24px Arial, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('📍 ' + locationText, 60, pillY + 44);

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(canvasWidth * 0.6, pillY, canvasWidth * 0.35, 70, 20);
      ctx.fill();

      ctx.textAlign = 'center';
      ctx.font = '900 24px Arial, sans-serif';
      ctx.fillStyle = '#000000';
      ctx.fillText('🗓️ ' + dateText, canvasWidth * 0.775, pillY + 44);

      // Footer link
      ctx.textAlign = 'center';
      ctx.font = 'bold 22px Arial, sans-serif';
      ctx.fillStyle = '#F472B6';
      ctx.fillText('➔ ' + footerLink, canvasWidth / 2, canvasHeight * 0.94);
    }
    // 5. GOLD AWARDS TEMPLATE
    else if (template === 'gold-awards') {
      const texts = slide.text ? slide.text.split('\\n') : [];
      const badge = texts[0] || 'CULTURE MEDIA AWARDS';
      const mainTitle = texts[1] || 'ARTIST OF THE WEEK';
      const name = texts[2] || 'LEADER DU CLASSEMENT';
      const stat = texts[3] || '+1.2M VUES CUMULÉES';

      const grad = ctx.createRadialGradient(canvasWidth/2, canvasHeight/2, 50, canvasWidth/2, canvasHeight/2, canvasWidth);
      grad.addColorStop(0, 'rgba(42, 28, 10, 0.7)');
      grad.addColorStop(1, 'rgba(9, 7, 3, 0.95)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      ctx.textAlign = 'center';
      ctx.font = '900 24px Arial, sans-serif';
      ctx.fillStyle = '#F59E0B';
      ctx.fillText('🏆 ' + badge.toUpperCase(), canvasWidth / 2, 130);

      ctx.font = '900 48px "Arial Black", Arial, sans-serif';
      ctx.fillStyle = '#FCD34D';
      ctx.shadowColor = 'rgba(245,158,11,0.8)';
      ctx.shadowBlur = 20;
      ctx.fillText(mainTitle.toUpperCase(), canvasWidth / 2, 210);
      ctx.shadowBlur = 0;

      // Bottom Gold Box
      const boxY = canvasHeight * 0.78;
      ctx.fillStyle = 'rgba(9, 7, 3, 0.85)';
      ctx.beginPath();
      ctx.roundRect(50, boxY, canvasWidth - 100, 140, 24);
      ctx.fill();
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.font = '900 36px Arial, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(name.toUpperCase(), canvasWidth / 2, boxY + 60);

      ctx.font = 'bold 26px Arial, sans-serif';
      ctx.fillStyle = '#F59E0B';
      ctx.fillText(stat, canvasWidth / 2, boxY + 105);
    }
    // 6. CYBER STREAM 4.0 TEMPLATE
    else if (template === 'cyber-event') {
      const texts = slide.text ? slide.text.split('\\n') : [];
      const badge = texts[0] || 'LIVE STREAM';
      const mainTitle = texts[1] || 'BUILDING THE FUTURE';
      const name = texts[2] || 'CONFÉRENCE EXCLUSIVE';
      const date = texts[3] || 'MERCREDI 15 OCTOBRE | 18H00';
      const link = texts[4] || 'join.culturemedia.com';

      const grad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
      grad.addColorStop(0, 'rgba(3, 7, 18, 0.7)');
      grad.addColorStop(1, 'rgba(11, 25, 44, 0.95)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      ctx.textAlign = 'left';
      ctx.font = '900 24px Arial, sans-serif';
      ctx.fillStyle = '#38BDF8';
      ctx.fillText('⚡ ' + badge.toUpperCase(), 60, 120);

      ctx.font = '900 48px "Arial Black", Arial, sans-serif';
      ctx.fillStyle = '#E0F2FE';
      ctx.shadowColor = 'rgba(56,189,248,0.8)';
      ctx.shadowBlur = 20;
      ctx.fillText(mainTitle.toUpperCase(), 60, canvasHeight * 0.65);
      ctx.shadowBlur = 0;

      const boxY = canvasHeight * 0.72;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.beginPath();
      ctx.roundRect(60, boxY, canvasWidth - 120, 160, 20);
      ctx.fill();
      ctx.strokeStyle = 'rgba(56,189,248,0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = '900 30px Arial, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(name, 90, boxY + 55);

      ctx.font = 'bold 24px Arial, sans-serif';
      ctx.fillStyle = '#94A3B8';
      ctx.fillText(date, 90, boxY + 95);

      ctx.font = 'bold 24px monospace';
      ctx.fillStyle = '#38BDF8';
      ctx.fillText(link, 90, boxY + 135);
    }`;

const insertCanvasMarker = "// 3. MENTIONS";
if (content.includes(insertCanvasMarker) && !content.includes("template === 'innovate-x'")) {
  content = content.replace(insertCanvasMarker, canvasDrawCode + '\n\n    ' + insertCanvasMarker);
}

// 2. Add JSX preview for innovate-x, gold-awards, cyber-event
const jsxPreviewCode = `                  {/* InnovateX Template Preview */}
                  {template === 'innovate-x' && (
                    <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(112,26,117,0.75) 0%, rgba(59,7,100,0.85) 60%, rgba(23,3,38,0.95) 100%)' }}>
                      <div className="text-center pt-4">
                        <div className="text-pink-400 text-xs font-black tracking-widest uppercase mb-1">
                          {activeSlide?.text?.split('\\n')[0] || 'PRESENT InnovateX 2026'}
                        </div>
                        <div className="text-white text-[10px] tracking-widest uppercase font-semibold">THEME</div>
                        <h2 className="text-white font-black text-2xl tracking-tight leading-none uppercase mt-1 flex items-center justify-center gap-1 drop-shadow-[0_4px_15px_rgba(217,70,239,0.8)]">
                          <span className="text-yellow-400 text-3xl">⚡</span>
                          <span>{activeSlide?.text?.split('\\n')[1] || 'SHAPING THE FUTURE WITH IDEAS'}</span>
                        </h2>
                      </div>

                      <div className="my-auto text-right pr-4">
                        <div className="inline-block bg-black/70 backdrop-blur-md border border-pink-500/40 rounded-xl p-3 text-right">
                          <div className="text-pink-400 text-[10px] italic font-semibold">Speaker</div>
                          <div className="text-white font-black text-sm">{activeSlide?.text?.split('\\n')[2] || 'Dr. Aminu Yusuf'}</div>
                          <div className="text-gray-300 text-[10px] font-medium">(AI Specialist)</div>
                        </div>
                      </div>

                      <div className="space-y-3 mb-2">
                        <div className="flex gap-2">
                          <div className="flex-1 bg-fuchsia-600 text-white font-bold text-[11px] p-2.5 rounded-xl flex items-center gap-2 shadow-lg">
                            <span>📍</span>
                            <span className="truncate">{activeSlide?.text?.split('\\n')[3] || 'Eko Convention Centre, Lagos'}</span>
                          </div>
                          <div className="bg-white text-black font-extrabold text-[11px] p-2.5 rounded-xl flex items-center gap-1.5 shadow-lg">
                            <span>🗓️</span>
                            <span>{activeSlide?.text?.split('\\n')[4] || '15th Nov, 2026'}</span>
                          </div>
                        </div>
                        <div className="text-center text-pink-300 text-[10px] font-bold tracking-wider">
                          ➔ {activeSlide?.text?.split('\\n')[5] || 'Register at: www.innovatex.com'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Gold Awards Template Preview */}
                  {template === 'gold-awards' && (
                    <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(42,28,10,0.7) 0%, rgba(9,7,3,0.95) 100%)' }}>
                      <div className="text-center pt-4">
                        <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">
                          🏆 {activeSlide?.text?.split('\\n')[0] || 'CULTURE MEDIA AWARDS'}
                        </span>
                        <h2 className="text-amber-300 font-black text-2xl tracking-tight leading-none uppercase mt-3 drop-shadow-[0_4px_20px_rgba(245,158,11,0.6)]">
                          {activeSlide?.text?.split('\\n')[1] || 'ARTIST OF THE WEEK'}
                        </h2>
                      </div>

                      <div className="w-full bg-black/85 backdrop-blur-md border border-amber-500/50 p-4 rounded-2xl text-center space-y-1 shadow-[0_0_25px_rgba(245,158,11,0.3)] mb-4">
                        <div className="text-white font-black text-lg uppercase">{activeSlide?.text?.split('\\n')[2] || 'LEADER DU CLASSEMENT'}</div>
                        <div className="text-amber-400 font-bold text-xs">{activeSlide?.text?.split('\\n')[3] || '+1.2M VUES CUMULÉES'}</div>
                      </div>
                    </div>
                  )}

                  {/* Cyber Event Template Preview */}
                  {template === 'cyber-event' && (
                    <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(3,7,18,0.7) 0%, rgba(11,25,44,0.95) 100%)' }}>
                      <div className="flex justify-between items-center pt-2">
                        <span className="bg-sky-500 text-black font-black px-3 py-1 rounded text-[10px] tracking-widest uppercase shadow-[0_0_15px_rgba(56,189,248,0.6)]">
                          ⚡ {activeSlide?.text?.split('\\n')[0] || 'LIVE STREAM'}
                        </span>
                        <span className="text-sky-400 text-xs font-mono font-bold">CYBER 4.0</span>
                      </div>

                      <div className="space-y-2 text-left mb-4">
                        <h2 className="text-sky-300 font-black text-2xl uppercase leading-none drop-shadow-[0_0_15px_rgba(56,189,248,0.8)]">
                          {activeSlide?.text?.split('\\n')[1] || 'BUILDING THE FUTURE'}
                        </h2>
                        <div className="bg-slate-900/90 border border-sky-500/40 p-4 rounded-xl space-y-1">
                          <div className="text-white font-bold text-sm">{activeSlide?.text?.split('\\n')[2] || 'CONFÉRENCE EXCLUSIVE'}</div>
                          <div className="text-gray-400 text-xs">{activeSlide?.text?.split('\\n')[3] || 'MERCREDI 15 OCTOBRE | 18H00'}</div>
                          <div className="text-sky-400 text-xs font-mono font-bold mt-1">{activeSlide?.text?.split('\\n')[4] || 'join.culturemedia.com'}</div>
                        </div>
                      </div>
                    </div>
                  )}`;

const insertPreviewMarker = "{/* Standard Text Preview */}";
if (content.includes(insertPreviewMarker) && !content.includes("template === 'innovate-x'")) {
  content = content.replace(insertPreviewMarker, jsxPreviewCode + '\n\n                  ' + insertPreviewMarker);
}

// 3. Update select dropdown options in ReelsStudioClient.js
const selectOld = `<option value="music-promo">🔥 Sortie Musique (OUT NOW)</option>
                  <option value="standard">Classique (Texte Standard)</option>
                  <option value="breaking">Breaking News (Texte Rouge)</option>`;

const selectNew = `<option value="music-promo">🔥 Sortie Musique (OUT NOW)</option>
                  <option value="innovate-x">⚡ InnovateX Neon (Speaker & Eclair 3D - Event/AI)</option>
                  <option value="gold-awards">👑 Prestige Gold Awards (Winner / Billboard)</option>
                  <option value="cyber-event">🌐 Cyber Stream 4.0 (Tech / Web3 Event)</option>
                  <option value="standard">Classique (Texte Standard)</option>
                  <option value="breaking">Breaking News (Texte Rouge)</option>`;

if (content.includes(selectOld)) {
  content = content.replace(selectOld, selectNew);
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Added 3 new Reels Studio templates successfully!");
