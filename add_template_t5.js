const fs = require('fs');
const filePath = 'src/app/admin/(dashboard)/instagram/custom/InstagramCustomClient.js';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add template t5 implementation
const templateT5Code = `    if (template === 't5') {
      // PRESTIGE GOLD GRID TOP 10 TEMPLATE (AWARD / GALLERY STYLE)
      return (
        <div style={{ width: '1080px', height: '1350px', background: 'linear-gradient(180deg, #090703 0%, #171105 50%, #090703 100%)', position: 'relative', overflow: 'hidden', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
          {/* Glowing Ambient Particles & Gold Flares */}
          <div style={{ position: 'absolute', top: '-150px', left: '50%', transform: 'translateX(-50%)', width: '700px', height: '500px', background: 'radial-gradient(circle, rgba(245,158,11,0.28) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-100px', right: '-100px', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(217,119,6,0.18) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />

          {bgImage && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, opacity: 0.15 }}>
              <img src={getProxiedImageUrl(bgImage)} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(25px) sepia(50%)' }} referrerPolicy="no-referrer" />
            </div>
          )}

          <div style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '40px 45px', boxSizing: 'border-box' }}>
            
            {/* Header / Partner Strip */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <img src={logoSrc} alt="CMN" style={{ height: '50px', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.8))' }} />
              {tag && (
                <span style={{ 
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', 
                  color: '#000', 
                  padding: '6px 20px', 
                  borderRadius: '30px', 
                  fontSize: '16px', 
                  fontWeight: '900', 
                  letterSpacing: '2px', 
                  textTransform: 'uppercase',
                  boxShadow: '0 4px 20px rgba(245,158,11,0.5)'
                }}>
                  🏆 {tag}
                </span>
              )}
            </div>

            {/* 3D Golden Title */}
            <div style={{ textAlign: 'center', marginBottom: '25px' }}>
              <div style={{ color: '#FBBF24', fontSize: '22px', fontWeight: '800', letterSpacing: '8px', textTransform: 'uppercase', marginBottom: '4px' }}>
                PALMARÈS OFFICIEL
              </div>
              <h1 style={{ 
                color: '#FFF', 
                fontSize: '48px', 
                fontWeight: '900', 
                lineHeight: '1.05', 
                margin: '0', 
                textTransform: 'uppercase', 
                letterSpacing: '-1px',
                background: 'linear-gradient(180deg, #FFFFFF 0%, #FBBF24 50%, #D97706 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 4px 15px rgba(245, 158, 11, 0.4))'
              }}>
                {title}
              </h1>
            </div>

            {/* 10 Cards Grid (5 columns x 2 rows) */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gridTemplateRows: 'repeat(2, 1fr)', gap: '15px', alignItems: 'center' }}>
              {(page.items || []).slice(0, 10).map((item, index) => {
                const rank = index + 1;
                const isTop1 = rank === 1;

                return (
                  <div key={index} style={{ 
                    height: '100%',
                    maxHeight: '430px',
                    display: 'flex', 
                    flexDirection: 'column', 
                    background: isTop1 ? 'linear-gradient(180deg, rgba(245,158,11,0.2) 0%, rgba(20,15,5,0.9) 100%)' : 'rgba(20,15,5,0.7)', 
                    borderRadius: '16px', 
                    overflow: 'hidden', 
                    border: isTop1 ? '2px solid #F59E0B' : '1px solid rgba(245,158,11,0.3)',
                    boxShadow: isTop1 ? '0 0 25px rgba(245,158,11,0.4)' : '0 4px 15px rgba(0,0,0,0.4)',
                    position: 'relative'
                  }}>
                    {/* Rank Badge Header */}
                    <div style={{ 
                      position: 'absolute', 
                      top: '8px', 
                      left: '8px', 
                      zIndex: 10,
                      background: isTop1 ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' : 'rgba(0,0,0,0.75)',
                      color: isTop1 ? '#000' : '#FBBF24',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '900',
                      border: '1px solid rgba(245,158,11,0.4)'
                    }}>
                      {isTop1 ? '👑 #1' : \`#\${rank}\`}
                    </div>

                    {/* Image / Portrait */}
                    <div style={{ flex: 1, position: 'relative', width: '100%', overflow: 'hidden', background: '#171105' }}>
                      {item.image ? (
                        <img 
                          src={getProxiedImageUrl(item.image)} 
                          alt=""
                          referrerPolicy="no-referrer"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FBBF24', fontSize: '24px', fontWeight: 'bold' }}>
                          {(item.title || 'A')[0]}
                        </div>
                      )}
                      
                      {/* Gradient overlay on bottom of image */}
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50px', background: 'linear-gradient(0deg, rgba(13,10,5,1) 0%, rgba(13,10,5,0) 100%)' }} />
                    </div>

                    {/* Artist & Value Label Box */}
                    <div style={{ padding: '8px 8px 10px 8px', textAlign: 'center', background: '#0D0A05' }}>
                      <div style={{ color: '#FFF', fontSize: '13px', fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.title}
                      </div>
                      <div style={{ color: '#FBBF24', fontSize: '11px', fontWeight: '700', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.value || item.subtitle}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{ borderTop: '1px solid rgba(245,158,11,0.2)', paddingTop: '15px', marginTop: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ color: '#FBBF24', fontSize: '18px', fontWeight: '800', letterSpacing: '3px' }}>{footerText || 'CULTURE MEDIA'}</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', fontWeight: '600' }}>{partnerText || 'STATISTIQUES OFFICIELLES'}</div>
            </div>
          </div>
        </div>
      );
    }`;

// Insert template t5 right after template t4 closing block
const t4EndMarker = "            </div>\n          </div>\n        </div>\n      );\n    }";
if (content.includes(t4EndMarker) && !content.includes("template === 't5'")) {
  content = content.replace(t4EndMarker, t4EndMarker + '\n\n' + templateT5Code);
}

// 2. Update select dropdown option
const selectT4Option = '<option value="t4">Modèle 4 : Classement (Top 10)</option>';
const selectT5Option = '<option value="t4">Modèle 4 : Classement Liste (Top 10)</option>\n                <option value="t5">Modèle 5 : Grille Prestige Or (Top 10 Galerie)</option>';

if (content.includes(selectT4Option)) {
  content = content.replace(selectT4Option, selectT5Option);
}

// 3. Update settings panel condition so t5 also shows artist photo editor
content = content.replaceAll("activePage.template === 't4'", "(activePage.template === 't4' || activePage.template === 't5')");

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Added template t5 successfully!");
