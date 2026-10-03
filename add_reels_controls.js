const fs = require('fs');
const filePath = 'src/app/admin/(dashboard)/reels-studio/ReelsStudioClient.js';
let content = fs.readFileSync(filePath, 'utf-8');

// Hide default text box when custom multi-line templates are selected
content = content.replace(
  "template !== 'music-promo' && (",
  "!['music-promo', 'innovate-x', 'gold-awards', 'cyber-event'].includes(template) && ("
);

// Add custom controls block for innovate-x, gold-awards, cyber-event
const customControlsCode = `              {template === 'innovate-x' && (
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

const insertControlsMarker = "{template === 'music-promo' && (";
if (content.includes(insertControlsMarker) && !content.includes("template === 'innovate-x' && (")) {
  content = content.replace(insertControlsMarker, customControlsCode + '\n              ' + insertControlsMarker);
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Updated Reels Studio controls successfully!");
