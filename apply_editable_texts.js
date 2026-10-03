const fs = require('fs');
const filePath = 'src/app/admin/(dashboard)/instagram/custom/InstagramCustomClient.js';
let content = fs.readFileSync(filePath, 'utf-8');

// Render Custom Blocks Overlay right before the end of each template container
const customBlocksRenderer = `
            {/* Custom Free Text Blocks Layer */}
            {(page.customBlocks || []).map((block) => (
              <div 
                key={block.id} 
                style={{ 
                  position: 'absolute', 
                  top: \`\${block.y ?? 50}%\`, 
                  left: \`\${block.x ?? 50}%\`, 
                  transform: 'translate(-50%, -50%)', 
                  zIndex: 999,
                  background: 'rgba(15,23,42,0.85)',
                  backdropFilter: 'blur(10px)',
                  border: '1.5px dashed #38BDF8',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <EditableText
                  text={block.text}
                  onChange={(val) => updateCustomTextBlock(block.id, { text: val })}
                  style={{
                    color: block.color || '#FFF',
                    fontSize: \`\${block.fontSize || 32}px\`,
                    fontWeight: block.fontWeight || 'bold'
                  }}
                />
                <button 
                  onClick={() => removeCustomTextBlock(block.id)}
                  style={{ background: '#EF4444', color: '#FFF', border: 'none', borderRadius: '50%', width: '22px', height: '22px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Supprimer ce texte libre"
                >
                  ✕
                </button>
              </div>
            ))}`;

// Insert customBlocksRenderer before template closing divs
content = content.replaceAll(
  "            {/* Footer */}\n            <div style={{ borderTop:",
  customBlocksRenderer + "\n\n            {/* Footer */}\n            <div style={{ borderTop:"
);

// Add "+ Ajouter un Texte Libre" button in settings panel
const addTextBtnCode = `
            {/* CANVA-STYLE STUDIO CONTROL BUTTON */}
            <div style={{ gridColumn: '1 / -1', background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)', padding: '18px', borderRadius: '14px', border: '1px solid #4F46E5', boxShadow: '0 4px 15px rgba(79,70,229,0.2)', marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ color: '#FFF', fontWeight: '900', fontSize: '15px' }}>⚡ Studio d'Édition Libre (Style Canva)</span>
                <span style={{ color: '#818CF8', fontSize: '12px', fontWeight: 'bold' }}>Double-clic sur l'aperçu pour éditer !</span>
              </div>
              <p style={{ color: '#A5B4FC', fontSize: '13px', margin: '0 0 12px 0' }}>
                Cliquez directement sur n'importe quel texte du visuel pour le modifier sur place, ou ajoutez des blocs de texte libres.
              </p>
              <button
                type="button"
                onClick={addCustomTextBlock}
                style={{ width: '100%', padding: '12px', background: '#4F46E5', color: '#FFF', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(79,70,229,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                ➕ Ajouter un Texte Libre sur le Visuel
              </button>

              {(activePage.customBlocks || []).length > 0 && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(activePage.customBlocks || []).map((b) => (
                    <div key={b.id} style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#FFF', fontSize: '12px', fontWeight: 'bold' }}>{b.text}</span>
                        <button onClick={() => removeCustomTextBlock(b.id)} style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>✕ Supprimer</button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                        <div>
                          <span style={{ color: '#A5B4FC', fontSize: '10px' }}>Taille</span>
                          <input type="range" min="16" max="100" value={b.fontSize || 32} onChange={(e) => updateCustomTextBlock(b.id, { fontSize: Number(e.target.value) })} style={{ width: '100%' }} />
                        </div>
                        <div>
                          <span style={{ color: '#A5B4FC', fontSize: '10px' }}>Pos X ({b.x || 50}%)</span>
                          <input type="range" min="0" max="100" value={b.x || 50} onChange={(e) => updateCustomTextBlock(b.id, { x: Number(e.target.value) })} style={{ width: '100%' }} />
                        </div>
                        <div>
                          <span style={{ color: '#A5B4FC', fontSize: '10px' }}>Pos Y ({b.y || 50}%)</span>
                          <input type="range" min="0" max="100" value={b.y || 50} onChange={(e) => updateCustomTextBlock(b.id, { y: Number(e.target.value) })} style={{ width: '100%' }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
`;

const settingsAnchor = `<div style={{ gridColumn: '1 / -1' }}>\n              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Template (Modèle)</label>`;
if (content.includes(settingsAnchor) && !content.includes("⚡ Studio d'Édition Libre (Style Canva)")) {
  content = content.replace(settingsAnchor, addTextBtnCode + '\n' + settingsAnchor);
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Integrated Canva-Style Studio Controls successfully!");
