const fs = require('fs');
const filePath = 'src/app/admin/(dashboard)/instagram/custom/InstagramCustomClient.js';
let content = fs.readFileSync(filePath, 'utf-8');

const oldT4Start = "    if (template === 't4') {";
const oldT4End = "      );";

const startIndex = content.indexOf(oldT4Start);
// Find the closing of t4 block
const endIndex = content.indexOf("    }\n  };\n\n  return (", startIndex);

const newT4Code = `    if (template === 't4') {
      // ULTRA-MODERN BILLBOARD STYLE TOP 10 RANKING TEMPLATE
      return (
        <div style={{ width: '1080px', height: '1350px', background: '#0B0818', position: 'relative', overflow: 'hidden', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
          {/* Ambient Glow Orbs */}
          <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(14,165,233,0.25) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-150px', left: '-150px', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(168,85,247,0.2) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />

          {bgImage && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, opacity: 0.18 }}>
              <img src={bgImage} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(30px) saturate(180%)' }} crossOrigin="anonymous" />
            </div>
          )}
          
          <div style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '45px 55px', boxSizing: 'border-box' }}>
            
            {/* Header with Logo & Tag */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <img src={logoSrc} alt="CMN" style={{ height: '55px', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.6))' }} />
              </div>
              {tag && (
                <span style={{ 
                  background: 'linear-gradient(135deg, #0284C7 0%, #7C3AED 100%)', 
                  color: '#FFF', 
                  padding: '8px 22px', 
                  borderRadius: '30px', 
                  fontSize: '18px', 
                  fontWeight: '800', 
                  letterSpacing: '2px', 
                  textTransform: 'uppercase',
                  boxShadow: '0 8px 25px rgba(124, 58, 237, 0.4)',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  🔥 {tag}
                </span>
              )}
            </div>

            {/* Title */}
            <div style={{ textAlign: 'center', marginBottom: '25px' }}>
              <h1 style={{ 
                color: '#FFF', 
                fontSize: '50px', 
                fontWeight: '900', 
                lineHeight: '1.1', 
                margin: '0', 
                textTransform: 'uppercase', 
                letterSpacing: '-1px',
                background: 'linear-gradient(180deg, #FFFFFF 0%, #CBD5E1 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 10px 30px rgba(0,0,0,0.9)'
              }}>
                {title}
              </h1>
            </div>

            {/* Top 10 Items List */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
              {(page.items || []).slice(0, 10).map((item, index) => {
                const rank = index + 1;
                const isTop1 = rank === 1;
                const isTop2 = rank === 2;
                const isTop3 = rank === 3;

                let rowBg = 'rgba(255, 255, 255, 0.04)';
                let rowBorder = '1px solid rgba(255, 255, 255, 0.08)';
                let rankColor = 'rgba(255, 255, 255, 0.5)';
                let rankBadge = \`#\${rank}\`;
                let rowGlow = 'none';

                if (isTop1) {
                  rowBg = 'linear-gradient(90deg, rgba(245, 158, 11, 0.25) 0%, rgba(30, 27, 75, 0.7) 100%)';
                  rowBorder = '1.5px solid rgba(245, 158, 11, 0.8)';
                  rankColor = '#FBBF24';
                  rankBadge = '👑 #1';
                  rowGlow = '0 8px 30px rgba(245, 158, 11, 0.25)';
                } else if (isTop2) {
                  rowBg = 'linear-gradient(90deg, rgba(148, 163, 184, 0.2) 0%, rgba(30, 27, 75, 0.6) 100%)';
                  rowBorder = '1.5px solid rgba(148, 163, 184, 0.6)';
                  rankColor = '#E2E8F0';
                  rankBadge = '🥈 #2';
                } else if (isTop3) {
                  rowBg = 'linear-gradient(90deg, rgba(217, 119, 6, 0.2) 0%, rgba(30, 27, 75, 0.6) 100%)';
                  rowBorder = '1.5px solid rgba(217, 119, 6, 0.6)';
                  rankColor = '#F59E0B';
                  rankBadge = '🥉 #3';
                }

                return (
                  <div key={index} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    background: rowBg, 
                    borderRadius: isTop1 ? '18px' : '14px', 
                    padding: isTop1 ? '13px 20px' : '10px 16px', 
                    border: rowBorder,
                    boxShadow: rowGlow,
                    backdropFilter: 'blur(12px)'
                  }}>
                    {/* Rank Badge */}
                    <div style={{ 
                      width: isTop1 ? '85px' : '65px', 
                      color: rankColor, 
                      fontSize: isTop1 ? '25px' : '21px', 
                      fontWeight: '900',
                      letterSpacing: '-0.5px'
                    }}>
                      {rankBadge}
                    </div>

                    {/* Thumbnail */}
                    {item.image && (
                      <div style={{ position: 'relative', marginRight: '16px', flexShrink: 0 }}>
                        <img 
                          src={item.image} 
                          style={{ 
                            width: isTop1 ? '64px' : '50px', 
                            height: isTop1 ? '64px' : '50px', 
                            borderRadius: '12px', 
                            objectFit: 'cover', 
                            border: isTop1 ? '2px solid #FBBF24' : '1px solid rgba(255,255,255,0.2)' 
                          }} 
                          crossOrigin="anonymous" 
                        />
                      </div>
                    )}

                    {/* Artist & Track Info */}
                    <div style={{ flex: 1, minWidth: 0, paddingRight: '10px' }}>
                      <div style={{ 
                        color: isTop1 ? '#FFF' : '#F1F5F9', 
                        fontSize: isTop1 ? '24px' : '20px', 
                        fontWeight: isTop1 ? '900' : '700', 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        maxWidth: '460px' 
                      }}>
                        {item.title}
                      </div>
                      {item.subtitle && (
                        <div style={{ 
                          color: isTop1 ? '#FCD34D' : 'rgba(255,255,255,0.55)', 
                          fontSize: isTop1 ? '17px' : '15px', 
                          fontWeight: '600', 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          marginTop: '2px'
                        }}>
                          {item.subtitle}
                        </div>
                      )}
                    </div>

                    {/* Metric Value Badge */}
                    <div style={{ 
                      background: isTop1 ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' : 'rgba(255,255,255,0.08)', 
                      color: isTop1 ? '#000' : '#38BDF8', 
                      fontSize: isTop1 ? '21px' : '18px', 
                      fontWeight: '900', 
                      textAlign: 'right', 
                      padding: isTop1 ? '7px 16px' : '5px 12px',
                      borderRadius: '30px',
                      border: isTop1 ? 'none' : '1px solid rgba(56,189,248,0.3)',
                      boxShadow: isTop1 ? '0 4px 15px rgba(245,158,11,0.4)' : 'none',
                      flexShrink: 0
                    }}>
                      {item.value}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '18px', marginTop: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '19px', fontWeight: '700', letterSpacing: '3px' }}>{footerText || 'CULTURE MEDIA'}</div>
              <div style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', padding: '5px 15px', borderRadius: '15px', fontSize: '15px', fontWeight: '600' }}>
                {partnerText || 'STATISTIQUES OFFICIELLES'}
              </div>
            </div>
          </div>
        </div>
      );
    }`;

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + newT4Code + content.substring(endIndex);
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log("Updated template t4 design successfully!");
} else {
  console.log("Could not locate template t4 block!", startIndex, endIndex);
}
