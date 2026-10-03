const fs = require('fs');
const filePath = 'src/app/admin/(dashboard)/instagram/custom/InstagramCustomClient.js';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Implementation of Template t9 (InnovateX Neon Speaker - Exact Replica)
const templateT9Code = `    if (template === 't9') {
      // INNOVATE-X NEON SPEAKER TEMPLATE (EXACT REPLICA)
      return (
        <div style={{ width: '1080px', height: '1350px', background: 'linear-gradient(180deg, #4A044E 0%, #701A75 35%, #3B0764 70%, #170326 100%)', position: 'relative', overflow: 'hidden', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
          
          {/* Cyber Circuit Trace Overlay */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.15, pointerEvents: 'none', backgroundImage: 'radial-gradient(#E879F9 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          <div style={{ position: 'absolute', top: '10%', left: '-100px', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(236,72,153,0.35) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '10%', right: '-100px', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(168,85,247,0.3) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />

          {/* Background Image fallback if uploaded */}
          {bgImage && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, opacity: 0.15 }}>
              <img src={getProxiedImageUrl(bgImage)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
            </div>
          )}

          <div style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '50px 55px', boxSizing: 'border-box' }}>
            
            {/* Top Logo & Presenter Bar */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px', fontWeight: '800', letterSpacing: '4px', textTransform: 'uppercase' }}>PRESENT</span>
              <img src={logoSrc} alt="CMN" style={{ height: '45px', filter: 'drop-shadow(0 4px 10px rgba(236,72,153,0.6))' }} />
              <span style={{ color: '#F472B6', fontSize: '22px', fontWeight: '900', letterSpacing: '2px' }}>2026</span>
            </div>

            {/* Title Section with Lightning Icon */}
            <div style={{ textAlign: 'center', marginBottom: '15px' }}>
              <div style={{ color: '#F472B6', fontSize: '18px', fontWeight: '800', letterSpacing: '8px', textTransform: 'uppercase', marginBottom: '8px' }}>
                T H E M E
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
                <div style={{ fontSize: '70px', filter: 'drop-shadow(0 0 25px #F59E0B)' }}>⚡</div>
                <h1 style={{ 
                  color: '#FFF', 
                  fontSize: '62px', 
                  fontWeight: '900', 
                  lineHeight: '1.0', 
                  margin: 0, 
                  textTransform: 'uppercase', 
                  letterSpacing: '-1px',
                  fontFamily: '"Arial Black", Impact, sans-serif',
                  filter: 'drop-shadow(0 0 25px rgba(236,72,153,0.8))'
                }}>
                  {renderTextWithHighlights(title || 'SHAPING THE FUTURE WITH IDEAS', highlightColor)}
                </h1>
              </div>
            </div>

            {/* Center Speaker Image Container */}
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '10px 0' }}>
              
              <div style={{ width: '420px', height: '520px', borderRadius: '30px', overflow: 'hidden', border: '3px solid rgba(244,114,182,0.6)', boxShadow: '0 0 50px rgba(236,72,153,0.5)', background: 'linear-gradient(180deg, rgba(59,7,100,0.5) 0%, rgba(23,3,38,0.8) 100%)', position: 'relative' }}>
                {activePage.items && activePage.items[0]?.image ? (
                  <img src={getProxiedImageUrl(activePage.items[0].image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                ) : (bgImage ? (
                  <img src={getProxiedImageUrl(bgImage)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F472B6', fontSize: '64px', fontWeight: 'bold' }}>
                    {(title || 'S')[0]}
                  </div>
                ))}
              </div>

              {/* Speaker Name Overlay (Bottom Right Signature Badge) */}
              <div style={{ position: 'absolute', bottom: '20px', right: '30px', background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(16px)', border: '1.5px solid rgba(244,114,182,0.5)', padding: '14px 22px', borderRadius: '18px', boxShadow: '0 10px 30px rgba(0,0,0,0.6)', textAlign: 'right' }}>
                <div style={{ color: '#F472B6', fontSize: '14px', fontStyle: 'italic', fontWeight: '700', fontFamily: 'serif' }}>Speaker</div>
                <div style={{ color: '#FFF', fontSize: '22px', fontWeight: '900', letterSpacing: '-0.5px' }}>
                  {activePage.items && activePage.items[0]?.title ? activePage.items[0].title : (partnerText || 'Dr. Aminu Yusuf')}
                </div>
                <div style={{ color: '#CBD5E1', fontSize: '13px', fontWeight: '600' }}>
                  {activePage.items && activePage.items[0]?.subtitle ? activePage.items[0].subtitle : (content || '(AI Specialist)')}
                </div>
              </div>
            </div>

            {/* Bottom Event Pills (Venue + Date) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '20px', marginBottom: '20px', marginTop: '10px' }}>
              <div style={{ background: 'linear-gradient(135deg, #EC4899 0%, #D946EF 100%)', color: '#FFF', padding: '18px 25px', borderRadius: '22px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 10px 30px rgba(236,72,153,0.4)', border: '1px solid rgba(255,255,255,0.3)' }}>
                <span style={{ fontSize: '28px' }}>📍</span>
                <span style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '0.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {tag || 'Eko Convention Centre, Lagos'}
                </span>
              </div>

              <div style={{ background: '#FFF', color: '#000', padding: '14px 28px', borderRadius: '22px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', border: '2px solid #F472B6' }}>
                <span style={{ fontSize: '28px' }}>🗓️</span>
                <div>
                  <div style={{ fontSize: '26px', fontWeight: '900', lineHeight: '1.0' }}>15th</div>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#C026D3', textTransform: 'uppercase' }}>Nov, 2026</div>
                </div>
              </div>
            </div>

            {/* Footer Registration Link */}
            <div style={{ textAlign: 'center', color: '#F472B6', fontSize: '17px', fontWeight: '800', letterSpacing: '2px' }}>
              ➔ Register at; {footerText || 'www.innovatex.com'}
            </div>
          </div>
        </div>
      );
    }`;

// Insert template t9 right after template t8 block
const t8EndMarker = "            </div>\n          </div>\n        </div>\n      );\n    }";
if (content.includes(t8EndMarker) && !content.includes("template === 't9'")) {
  content = content.replace(t8EndMarker, t8EndMarker + '\n\n' + templateT9Code);
}

// Update select dropdown option
const selectT8Option = '<option value="t8">Modèle 8 : Purple Rocket Pop (Duo/Trio Cartes Event - Style Tech)</option>';
const selectT9Option = `<option value="t8">Modèle 8 : Purple Rocket Pop (Duo/Trio Cartes Event - Style Tech)</option>
                <option value="t9">Modèle 9 : InnovateX Neon Speaker (Copie Conforme Affiche)</option>`;

if (content.includes(selectT8Option)) {
  content = content.replace(selectT8Option, selectT9Option);
}

// Update settings panel condition to include t9 for artist/speaker photo editing
content = content.replaceAll(
  "['t4', 't5', 't6', 't7', 't8'].includes(activePage.template)",
  "['t4', 't5', 't6', 't7', 't8', 't9'].includes(activePage.template)"
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Added template t9 (InnovateX Neon Speaker Exact Replica) successfully!");
