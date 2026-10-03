const fs = require('fs');
const filePath = 'src/app/admin/(dashboard)/instagram/custom/InstagramCustomClient.js';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Implementation of Template t6 (Cyber Tech Neon 4.0)
const templateT6Code = `    if (template === 't6') {
      // CYBER TECH NEON 4.0 TEMPLATE (HBR SLANTED COLUMNS STYLE)
      const itemsList = (page.items || []).length > 0 ? page.items.slice(0, 4) : [
        { title: 'MR. NGUYỄN THÀNH', subtitle: 'Sáng lập tổ chức', image: '' },
        { title: 'MR. TONY DZUNG', subtitle: 'Chairman of HBR', image: '' },
        { title: 'MR. CẤN VĂN LỰC', subtitle: 'Cố vấn cấp cao', image: '' },
        { title: 'MR. NGUYỄN KIM', subtitle: 'Chuyên gia tài chính', image: '' }
      ];

      return (
        <div style={{ width: '1080px', height: '1350px', background: 'linear-gradient(180deg, #050B14 0%, #0A192F 50%, #030712 100%)', position: 'relative', overflow: 'hidden', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
          {/* Cyber Neon Flare Orbs */}
          <div style={{ position: 'absolute', top: '-100px', right: '-50px', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(56,189,248,0.3) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-100px', left: '-50px', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(2,132,199,0.25) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />

          {bgImage && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, opacity: 0.2 }}>
              <img src={getProxiedImageUrl(bgImage)} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(20px) hue-rotate(180deg)' }} referrerPolicy="no-referrer" />
            </div>
          )}

          <div style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '50px 50px', boxSizing: 'border-box' }}>
            
            {/* Header / Logo Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <img src={logoSrc} alt="CMN" style={{ height: '55px', filter: 'drop-shadow(0 4px 15px rgba(56,189,248,0.5))' }} />
              {tag && (
                <span style={{ 
                  background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)', 
                  color: '#FFF', 
                  padding: '8px 24px', 
                  borderRadius: '6px', 
                  fontSize: '16px', 
                  fontWeight: '900', 
                  letterSpacing: '2px', 
                  textTransform: 'uppercase',
                  boxShadow: '0 0 20px rgba(14,165,233,0.5)',
                  border: '1px solid rgba(255,255,255,0.3)'
                }}>
                  ⚡ {tag}
                </span>
              )}
            </div>

            {/* 3D Cyan Cyber Title */}
            <div style={{ textAlign: 'right', marginBottom: '40px', paddingRight: '20px' }}>
              <h1 style={{ 
                color: '#38BDF8', 
                fontSize: '64px', 
                fontWeight: '900', 
                lineHeight: '1.0', 
                margin: '0', 
                textTransform: 'uppercase', 
                letterSpacing: '-1px',
                background: 'linear-gradient(180deg, #E0F2FE 0%, #38BDF8 50%, #0284C7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 4px 20px rgba(56, 189, 248, 0.6))'
              }}>
                {title || 'TRÍ TUỆ ĐẦU TƯ 4.0'}
              </h1>
              <div style={{ color: '#F1F5F9', fontSize: '20px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', marginTop: '10px' }}>
                {content || 'LE GUIDE ULTIME POUR RÉUSSIR VOS PROJETS'}
              </div>
            </div>

            {/* 4 Slanted Parallel Columns (Angled Speaker Cards) */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px', alignItems: 'end', paddingBottom: '30px' }}>
              {itemsList.map((item, idx) => (
                <div key={idx} style={{ 
                  height: idx % 2 === 0 ? '540px' : '490px',
                  background: 'linear-gradient(180deg, rgba(14,165,233,0.15) 0%, rgba(15,23,42,0.85) 100%)', 
                  borderRadius: '16px', 
                  border: '1.5px solid #38BDF8', 
                  boxShadow: '0 0 25px rgba(56,189,248,0.3)', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  overflow: 'hidden',
                  transform: 'skewX(-4deg)',
                  position: 'relative'
                }}>
                  {/* Photo inside slanted card */}
                  <div style={{ flex: 1, position: 'relative', width: '100%', overflow: 'hidden', transform: 'skewX(4deg) scale(1.15)' }}>
                    {item.image ? (
                      <img src={getProxiedImageUrl(item.image)} alt="" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38BDF8', fontSize: '32px', fontWeight: 'bold', background: '#0F172A' }}>
                        {(item.title || 'A')[0]}
                      </div>
                    )}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '70px', background: 'linear-gradient(0deg, rgba(15,23,42,1) 0%, rgba(15,23,42,0) 100%)' }} />
                  </div>

                  {/* Label below */}
                  <div style={{ padding: '15px 12px', background: '#0F172A', transform: 'skewX(4deg)', borderTop: '1px solid rgba(56,189,248,0.3)' }}>
                    <div style={{ color: '#FFF', fontSize: '15px', fontWeight: '900', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.title}
                    </div>
                    <div style={{ color: '#94A3B8', fontSize: '12px', fontWeight: '600', marginTop: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.subtitle || item.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Event Banner */}
            <div style={{ borderTop: '1px solid rgba(56,189,248,0.3)', paddingTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ color: '#FFF', fontSize: '24px', fontWeight: '900', letterSpacing: '1px' }}>{footerText || 'Hà Nội 22/07/2026'}</div>
                <div style={{ color: '#F59E0B', fontSize: '14px', fontWeight: '700', marginTop: '2px' }}>Duy nhất 50 vé VIP giao lưu cùng diễn giả</div>
              </div>
              <div style={{ background: 'rgba(56,189,248,0.15)', color: '#38BDF8', padding: '10px 22px', borderRadius: '30px', fontSize: '15px', fontWeight: '800', border: '1px solid #38BDF8' }}>
                {partnerText || 'CULTURE MEDIA 4.0'}
              </div>
            </div>
          </div>
        </div>
      );
    }`;

// 2. Implementation of Template t7 (Web3 Crypto Space Halo)
const templateT7Code = `    if (template === 't7') {
      // WEB3 CRYPTO SPACE HALO TEMPLATE
      const itemsList = (page.items || []).length > 0 ? page.items.slice(0, 4) : [
        { title: 'ELIZABETH ADELIN', subtitle: 'Community BlockDevId', value: 'MODERATOR', image: '' },
        { title: 'DENNIS', subtitle: 'Head of Community', value: 'SPEAKER', image: '' },
        { title: 'CARRINA CHITTRA', subtitle: 'Web3 Content Creator', value: 'SPEAKER', image: '' },
        { title: 'WINSTON RENATAN', subtitle: 'CEO Encoteki', value: 'SPEAKER', image: '' }
      ];

      return (
        <div style={{ width: '1080px', height: '1350px', background: '#020617', position: 'relative', overflow: 'hidden', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
          {/* Top & Bottom Giant Neon Ring Halos */}
          <div style={{ position: 'absolute', top: '-250px', left: '50%', transform: 'translateX(-50%)', width: '900px', height: '500px', borderRadius: '50%', border: '2px solid rgba(56,189,248,0.6)', boxShadow: '0 0 80px rgba(56,189,248,0.5)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-250px', left: '50%', transform: 'translateX(-50%)', width: '900px', height: '500px', borderRadius: '50%', border: '2px solid rgba(56,189,248,0.6)', boxShadow: '0 0 80px rgba(56,189,248,0.5)', pointerEvents: 'none' }} />

          {bgImage && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, opacity: 0.12 }}>
              <img src={getProxiedImageUrl(bgImage)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
            </div>
          )}

          <div style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '50px 45px', boxSizing: 'border-box' }}>
            
            {/* Corporate Logo Header */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '30px', marginBottom: '35px' }}>
              <img src={logoSrc} alt="CMN" style={{ height: '45px' }} />
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '20px' }}>|</span>
              <span style={{ color: '#FFF', fontWeight: '800', fontSize: '18px', letterSpacing: '2px' }}>BLOCKDEV • UPH</span>
            </div>

            {/* Title & Tagline */}
            <div style={{ textAlign: 'center', marginBottom: '50px' }}>
              <h1 style={{ color: '#FFF', fontSize: '52px', fontWeight: '900', letterSpacing: '-0.5px', margin: '0 0 10px 0', textTransform: 'uppercase' }}>
                {title || 'BUILDING IN THE CRYPTO SPACE'}
              </h1>
              <div style={{ color: '#38BDF8', fontSize: '18px', fontWeight: '700', letterSpacing: '4px', textTransform: 'uppercase' }}>
                {content || 'LEARN. BUILD. MAKE IMPACT. BEYOND THE CHARTS'}
              </div>
            </div>

            {/* Row of 4 Glassmorphism Cards */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', alignItems: 'center' }}>
              {itemsList.map((item, idx) => (
                <div key={idx} style={{ 
                  height: '420px', 
                  background: 'linear-gradient(180deg, rgba(30,58,138,0.6) 0%, rgba(15,23,42,0.9) 100%)', 
                  borderRadius: '20px', 
                  border: '1px solid rgba(56,189,248,0.4)', 
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5), inset 0 0 20px rgba(56,189,248,0.2)', 
                  padding: '15px', 
                  boxSizing: 'border-box',
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center'
                }}>
                  {/* Photo Container */}
                  <div style={{ width: '100%', height: '230px', borderRadius: '14px', overflow: 'hidden', background: '#0F172A', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {item.image ? (
                      <img src={getProxiedImageUrl(item.image)} alt="" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38BDF8', fontSize: '32px', fontWeight: 'bold' }}>
                        {(item.title || 'A')[0]}
                      </div>
                    )}
                  </div>

                  {/* Role Pill */}
                  <div style={{ color: '#38BDF8', fontSize: '11px', fontWeight: '900', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '6px' }}>
                    {item.value || (idx === 0 ? 'MODERATOR' : 'SPEAKER')}
                  </div>

                  {/* Name */}
                  <div style={{ color: '#FFF', fontSize: '15px', fontWeight: '900', textTransform: 'uppercase', lineHeight: '1.2', marginBottom: '4px' }}>
                    {item.title}
                  </div>

                  {/* Subtitle */}
                  <div style={{ color: '#94A3B8', fontSize: '11px', fontWeight: '500', lineHeight: '1.3' }}>
                    {item.subtitle}
                  </div>
                </div>
              ))}
            </div>

            {/* Event Time & Venue Box */}
            <div style={{ textAlign: 'center', marginTop: '30px', padding: '20px 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ color: '#FFF', fontSize: '22px', fontWeight: '800' }}>
                {footerText || 'Wednesday, 15 October 2026 | 13.00'}
              </div>
              <div style={{ color: '#38BDF8', fontSize: '16px', fontWeight: '600', marginTop: '4px' }}>
                {partnerText || 'HOPE Building, Lippo Village • Official Event'}
              </div>
            </div>
          </div>
        </div>
      );
    }`;

// 3. Implementation of Template t8 (Purple Rocket Pop)
const templateT8Code = `    if (template === 't8') {
      // PURPLE ROCKET POP TEMPLATE (DUO/TRIO TECH EVENT STYLE)
      const itemsList = (page.items || []).length > 0 ? page.items.slice(0, 2) : [
        { title: 'Iji Fred', subtitle: 'Director of Engineering, Enyata', image: '', color: '#A855F7' },
        { title: 'Elizabeth Eyinade', subtitle: 'HR Consultant / Product Manager', image: '', color: '#F59E0B' }
      ];

      return (
        <div style={{ width: '1080px', height: '1350px', background: 'linear-gradient(180deg, #2E1065 0%, #3B0764 50%, #1E1B4B 100%)', position: 'relative', overflow: 'hidden', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
          {/* Ambient Glows */}
          <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(168,85,247,0.35) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />

          {bgImage && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, opacity: 0.15 }}>
              <img src={getProxiedImageUrl(bgImage)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
            </div>
          )}

          <div style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '55px 60px', boxSizing: 'border-box' }}>
            
            {/* Header Logo & Event Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
              <img src={logoSrc} alt="CMN" style={{ height: '55px' }} />
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase' }}>
                BUILDUP COHORT 1
              </div>
            </div>

            {/* Title Container */}
            <div style={{ marginBottom: '40px' }}>
              <h1 style={{ color: '#FFF', fontSize: '56px', fontWeight: '900', lineHeight: '1.1', margin: '0 0 15px 0' }}>
                {title || "What's Next After Tech Training?"}
              </h1>
              <div style={{ background: '#581C87', color: '#FFF', padding: '16px 24px', borderRadius: '12px', fontSize: '24px', fontWeight: '800', borderLeft: '6px solid #F59E0B' }}>
                {content || 'Positioning Yourself for Real Opportunities as a NewBie'}
              </div>
            </div>

            {/* Speakers Label */}
            <div style={{ marginBottom: '20px' }}>
              <span style={{ background: '#F59E0B', color: '#000', padding: '8px 22px', borderRadius: '30px', fontSize: '18px', fontWeight: '900', textTransform: 'uppercase' }}>
                {tag || 'Intervenants'}
              </span>
            </div>

            {/* Duo / Trio Color Block Speaker Cards */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '25px', alignItems: 'center' }}>
              {itemsList.map((item, idx) => {
                const cardColor = idx % 2 === 0 ? '#C084FC' : '#FBBF24';
                return (
                  <div key={idx} style={{ 
                    height: '480px', 
                    background: '#1E1B4B', 
                    borderRadius: '24px', 
                    overflow: 'hidden', 
                    border: '1px solid rgba(255,255,255,0.15)', 
                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    {/* Color background portrait card */}
                    <div style={{ flex: 1, background: cardColor, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                      {item.image ? (
                        <img src={getProxiedImageUrl(item.image)} alt="" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ fontSize: '48px', fontWeight: '900', color: '#000', marginBottom: '40px' }}>
                          {(item.title || 'A')[0]}
                        </div>
                      )}
                    </div>

                    {/* Dark Caption Box */}
                    <div style={{ padding: '20px 20px', background: '#0F172A' }}>
                      <div style={{ color: '#FFF', fontSize: '22px', fontWeight: '900', marginBottom: '4px' }}>
                        {item.title}
                      </div>
                      <div style={{ color: '#94A3B8', fontSize: '14px', fontWeight: '600' }}>
                        {item.subtitle || item.value}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Banner */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '25px', marginTop: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: '#FFF', fontSize: '26px', fontWeight: '900' }}>{footerText || 'Thursday 30th April, 2026'}</div>
                <div style={{ color: '#F59E0B', fontSize: '20px', fontWeight: '800' }}>4:00pm GMT</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#C084FC', fontSize: '15px', fontWeight: '700' }}>Live on official stream</div>
                <div style={{ color: '#FFF', fontSize: '16px', fontWeight: '800' }}>{partnerText || 'meet.jit.si / culturemedia'}</div>
              </div>
            </div>
          </div>
        </div>
      );
    }`;

// Insert template t6, t7, t8 right after template t5 block
const t5EndMarker = "            </div>\n          </div>\n        </div>\n      );\n    }";
if (content.includes(t5EndMarker) && !content.includes("template === 't6'")) {
  content = content.replace(t5EndMarker, t5EndMarker + '\n\n' + templateT6Code + '\n\n' + templateT7Code + '\n\n' + templateT8Code);
}

// Update select dropdown options
const dropdownOld = `<option value="t5">Modèle 5 : Grille Prestige Or (Top 10 Galerie 5x2)</option>`;
const dropdownNew = `<option value="t5">Modèle 5 : Grille Prestige Or (Top 10 Galerie 5x2)</option>
                <option value="t6">Modèle 6 : Cyber Tech Neon (4 Colonnes Biseautées)</option>
                <option value="t7">Modèle 7 : Web3 Glassmorphism (Halo Néon & Cartes)</option>
                <option value="t8">Modèle 8 : Purple Rocket Pop (Duo/Trio Cartes Event)</option>`;

if (content.includes(dropdownOld)) {
  content = content.replace(dropdownOld, dropdownNew);
}

// Update settings panel condition to include t6, t7, t8 for artist photo editing
content = content.replaceAll(
  "(activePage.template === 't4' || activePage.template === 't5')",
  "['t4', 't5', 't6', 't7', 't8'].includes(activePage.template)"
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Added 3 new templates (t6, t7, t8) successfully!");
