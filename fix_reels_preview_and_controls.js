const fs = require('fs');
const filePath = 'src/app/admin/(dashboard)/reels-studio/ReelsStudioClient.js';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Insert preview overlays right inside canvas overlays preview area
const previewOverlays = `                  {/* InnovateX Neon Preview Overlay */}
                  {template === 'innovate-x' && (
                    <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(112,26,117,0.7) 0%, rgba(59,7,100,0.85) 60%, rgba(23,3,38,0.95) 100%)' }}>
                      <div className="text-center pt-2">
                        <div className="text-pink-400 text-[10px] font-black tracking-widest uppercase mb-0.5">
                          {activeSlide?.text?.split('\\n')[0] || 'PRESENT InnovateX 2026'}
                        </div>
                        <div className="text-white text-[9px] tracking-widest uppercase font-semibold">THEME</div>
                        <h2 className="text-white font-black text-xl tracking-tight leading-none uppercase mt-1 flex items-center justify-center gap-1 drop-shadow-[0_4px_15px_rgba(217,70,239,0.8)]">
                          <span className="text-yellow-400 text-2xl">⚡</span>
                          <span>{activeSlide?.text?.split('\\n')[1] || 'SHAPING THE FUTURE WITH IDEAS'}</span>
                        </h2>
                      </div>

                      <div className="my-auto text-right pr-2">
                        <div className="inline-block bg-black/75 backdrop-blur-md border border-pink-500/40 rounded-xl p-2.5 text-right">
                          <div className="text-pink-400 text-[9px] italic font-semibold">Speaker</div>
                          <div className="text-white font-black text-xs">{activeSlide?.text?.split('\\n')[2] || 'Dr. Aminu Yusuf'}</div>
                          <div className="text-gray-300 text-[9px] font-medium">(AI Specialist)</div>
                        </div>
                      </div>

                      <div className="space-y-2 mb-1">
                        <div className="flex gap-2">
                          <div className="flex-1 bg-fuchsia-600 text-white font-bold text-[10px] p-2 rounded-xl flex items-center gap-1.5 shadow-lg">
                            <span>📍</span>
                            <span className="truncate">{activeSlide?.text?.split('\\n')[3] || 'Eko Convention Centre, Lagos'}</span>
                          </div>
                          <div className="bg-white text-black font-extrabold text-[10px] p-2 rounded-xl flex items-center gap-1 shadow-lg">
                            <span>🗓️</span>
                            <span>{activeSlide?.text?.split('\\n')[4] || '15th Nov, 2026'}</span>
                          </div>
                        </div>
                        <div className="text-center text-pink-300 text-[9px] font-bold tracking-wider">
                          ➔ {activeSlide?.text?.split('\\n')[5] || 'Register at: www.innovatex.com'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Gold Awards Preview Overlay */}
                  {template === 'gold-awards' && (
                    <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(42,28,10,0.7) 0%, rgba(9,7,3,0.95) 100%)' }}>
                      <div className="text-center pt-2">
                        <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase">
                          🏆 {activeSlide?.text?.split('\\n')[0] || 'CULTURE MEDIA AWARDS'}
                        </span>
                        <h2 className="text-amber-300 font-black text-xl tracking-tight leading-none uppercase mt-2 drop-shadow-[0_4px_20px_rgba(245,158,11,0.6)]">
                          {activeSlide?.text?.split('\\n')[1] || 'ARTIST OF THE WEEK'}
                        </h2>
                      </div>

                      <div className="w-full bg-black/85 backdrop-blur-md border border-amber-500/50 p-3 rounded-xl text-center space-y-1 shadow-[0_0_25px_rgba(245,158,11,0.3)] mb-2">
                        <div className="text-white font-black text-sm uppercase">{activeSlide?.text?.split('\\n')[2] || 'LEADER DU CLASSEMENT'}</div>
                        <div className="text-amber-400 font-bold text-[10px]">{activeSlide?.text?.split('\\n')[3] || '+1.2M VUES CUMULÉES'}</div>
                      </div>
                    </div>
                  )}

                  {/* Cyber Event Preview Overlay */}
                  {template === 'cyber-event' && (
                    <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(3,7,18,0.7) 0%, rgba(11,25,44,0.95) 100%)' }}>
                      <div className="flex justify-between items-center pt-1">
                        <span className="bg-sky-500 text-black font-black px-2.5 py-0.5 rounded text-[9px] tracking-widest uppercase shadow-[0_0_15px_rgba(56,189,248,0.6)]">
                          ⚡ {activeSlide?.text?.split('\\n')[0] || 'LIVE STREAM'}
                        </span>
                        <span className="text-sky-400 text-[10px] font-mono font-bold">CYBER 4.0</span>
                      </div>

                      <div className="space-y-2 text-left mb-2">
                        <h2 className="text-sky-300 font-black text-xl uppercase leading-none drop-shadow-[0_0_15px_rgba(56,189,248,0.8)]">
                          {activeSlide?.text?.split('\\n')[1] || 'BUILDING THE FUTURE'}
                        </h2>
                        <div className="bg-slate-900/90 border border-sky-500/40 p-3 rounded-xl space-y-0.5">
                          <div className="text-white font-bold text-xs">{activeSlide?.text?.split('\\n')[2] || 'CONFÉRENCE EXCLUSIVE'}</div>
                          <div className="text-gray-400 text-[10px]">{activeSlide?.text?.split('\\n')[3] || 'MERCREDI 15 OCTOBRE | 18H00'}</div>
                          <div className="text-sky-400 text-[10px] font-mono font-bold mt-1">{activeSlide?.text?.split('\\n')[4] || 'join.culturemedia.com'}</div>
                        </div>
                      </div>
                    </div>
                  )}`;

const previewMarker = "{/* Music Promo Template Preview */}";
if (content.includes(previewMarker) && !content.includes("InnovateX Neon Preview Overlay")) {
  content = content.replace(previewMarker, previewMarker + '\n' + previewOverlays);
}

// 2. Insert sidebar text editors under slide editing section
const sidebarControls = `              {template === 'innovate-x' && (
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-2">Contenu InnovateX Neon</label>
                  <div className="text-xs text-gray-500 mb-2 space-y-1">
                    <p>Ligne 1 : En-tête (ex: PRESENT InnovateX 2026)</p>
                    <p>Ligne 2 : Titre principal (ex: SHAPING THE FUTURE WITH IDEAS)</p>
                    <p>Ligne 3 : Intervenant & Rôle (ex: Dr. Aminu Yusuf (AI Specialist))</p>
                    <p>Ligne 4 : Lieu (ex: Eko Convention Centre, Lagos)</p>
                    <p>Ligne 5 : Date (ex: 15th Nov, 2026)</p>
                    <p>Ligne 6 : Lien / Inscription (ex: Register at: www.innovatex.com)</p>
                  </div>
                  <textarea 
                    value={activeSlide?.text || ''} 
                    onChange={(e) => handleUpdateSlide(activeSlide.id, { text: e.target.value })}
                    className="w-full bg-[#18153a] border border-[#2d295a] text-pink-400 font-mono rounded-xl p-4 outline-none focus:border-blue-500 h-36 resize-none leading-relaxed"
                  />
                </div>
              )}

              {template === 'gold-awards' && (
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-2">Contenu Gold Awards</label>
                  <div className="text-xs text-gray-500 mb-2 space-y-1">
                    <p>Ligne 1 : Badge supérieur (ex: CULTURE MEDIA AWARDS)</p>
                    <p>Ligne 2 : Titre trophée (ex: ARTIST OF THE WEEK)</p>
                    <p>Ligne 3 : Nom du gagnant (ex: LEADER DU CLASSEMENT)</p>
                    <p>Ligne 4 : Statistique / Récompense (ex: +1.2M VUES CUMULÉES)</p>
                  </div>
                  <textarea 
                    value={activeSlide?.text || ''} 
                    onChange={(e) => handleUpdateSlide(activeSlide.id, { text: e.target.value })}
                    className="w-full bg-[#18153a] border border-[#2d295a] text-amber-400 font-mono rounded-xl p-4 outline-none focus:border-blue-500 h-32 resize-none leading-relaxed"
                  />
                </div>
              )}

              {template === 'cyber-event' && (
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-2">Contenu Cyber Event</label>
                  <div className="text-xs text-gray-500 mb-2 space-y-1">
                    <p>Ligne 1 : Badge néon (ex: LIVE STREAM)</p>
                    <p>Ligne 2 : Grand Titre Cyber (ex: BUILDING THE FUTURE)</p>
                    <p>Ligne 3 : Nom de la conférence / Événement</p>
                    <p>Ligne 4 : Date & Heure (ex: MERCREDI 15 OCTOBRE | 18H00)</p>
                    <p>Ligne 5 : Lien d'accès (ex: join.culturemedia.com)</p>
                  </div>
                  <textarea 
                    value={activeSlide?.text || ''} 
                    onChange={(e) => handleUpdateSlide(activeSlide.id, { text: e.target.value })}
                    className="w-full bg-[#18153a] border border-[#2d295a] text-sky-400 font-mono rounded-xl p-4 outline-none focus:border-blue-500 h-32 resize-none leading-relaxed"
                  />
                </div>
              )}`;

const sidebarMarker = "{template === 'music-promo' && (";
if (content.includes(sidebarMarker) && !content.includes("Contenu InnovateX Neon")) {
  content = content.replace(sidebarMarker, sidebarControls + '\n              ' + sidebarMarker);
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Fixed Reels preview and sidebar controls successfully!");
