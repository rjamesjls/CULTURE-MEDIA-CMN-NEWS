const fs = require('fs');
const filePath = 'src/app/admin/(dashboard)/instagram/custom/InstagramCustomClient.js';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add handleItemImageUpload helper
const uploadHelper = `
  const handleItemImageUpload = (itemIndex, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      const currentItems = [...(activePage.items || [])];
      if (currentItems[itemIndex]) {
        currentItems[itemIndex] = { ...currentItems[itemIndex], image: dataUrl };
        updateActivePage('items', currentItems);
      }
    };
    reader.readAsDataURL(file);
  };
`;

if (!content.includes('const handleItemImageUpload =')) {
  content = content.replace('const handleImageUpload =', uploadHelper + '\n  const handleImageUpload =');
}

// 2. Add the Top 10 Customization Panel in Settings
const settingsSection = `
            {activePage.template === 't4' && (
              <div style={{ gridColumn: '1 / -1', marginTop: '10px', paddingTop: '20px', borderTop: '2px solid #E2E8F0' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🎨 Personnaliser les Photos & Titres du Top 10
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(activePage.items || []).slice(0, 10).map((item, idx) => (
                    <div key={idx} style={{ background: '#F8FAFC', padding: '12px 15px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontWeight: '900', fontSize: '15px', color: idx === 0 ? '#F59E0B' : (idx === 1 ? '#94A3B8' : (idx === 2 ? '#D97706' : '#64748B')), width: '28px', textAlign: 'center' }}>
                        #{idx + 1}
                      </span>
                      <div style={{ width: '45px', height: '45px', borderRadius: '8px', overflow: 'hidden', background: '#CBD5E1', flexShrink: 0, position: 'relative', border: '1px solid #CBD5E1' }}>
                        {item.image ? (
                          <img src={getProxiedImageUrl(item.image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontWeight: 'bold' }}>
                            {(item.title || 'A')[0]}
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <input 
                          type="text" 
                          value={item.title || ''} 
                          onChange={(e) => {
                            const currentItems = [...(activePage.items || [])];
                            currentItems[idx] = { ...currentItems[idx], title: e.target.value };
                            updateActivePage('items', currentItems);
                          }}
                          placeholder="Nom de l'artiste / Titre"
                          style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input 
                            type="text" 
                            value={item.subtitle || ''} 
                            onChange={(e) => {
                              const currentItems = [...(activePage.items || [])];
                              currentItems[idx] = { ...currentItems[idx], subtitle: e.target.value };
                              updateActivePage('items', currentItems);
                            }}
                            placeholder="Sous-titre (ex: Artiste / Secteur)"
                            style={{ flex: 1, padding: '4px 8px', borderRadius: '4px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                          />
                          <input 
                            type="text" 
                            value={item.value || ''} 
                            onChange={(e) => {
                              const currentItems = [...(activePage.items || [])];
                              currentItems[idx] = { ...currentItems[idx], value: e.target.value };
                              updateActivePage('items', currentItems);
                            }}
                            placeholder="Stat (ex: +45.2K vues)"
                            style={{ width: '120px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                          />
                        </div>
                      </div>
                      <div>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '7px 12px', background: '#0EA5E9', color: '#FFF', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 2px 4px rgba(14,165,233,0.2)' }}>
                          📷 Photo
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => handleItemImageUpload(idx, e)}
                            style={{ display: 'none' }}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
`;

const anchor = "{/* SECTION LEGENDE */}";
if (!content.includes('Personnaliser les Photos & Titres du Top 10')) {
  // Find where settings controls end before legend
  const targetIndex = content.indexOf('</div>\n\n      {/* SECTION LEGENDE */}');
  if (targetIndex !== -1) {
    content = content.substring(0, targetIndex) + settingsSection + '\n' + content.substring(targetIndex);
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log("Added artist photo customization panel successfully!");
  } else {
    console.log("Target index not found for settings panel.");
  }
}
