const fs = require('fs');
const filePath = 'src/app/admin/(dashboard)/instagram/custom/InstagramCustomClient.js';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add EditableText and DraggableBox components right before InstagramCustomClient export
const studioComponents = `
// --- CANVA-STYLE INLINE EDIT & DRAG STUDIO COMPONENTS ---
const EditableText = ({ text, onChange, style = {}, className = '', placeholder = 'Écrivez ici...' }) => {
  return (
    <span
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => onChange(e.currentTarget.innerText)}
      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.blur(); } }}
      style={{
        outline: '1.5px dashed rgba(56,189,248,0.5)',
        outlineOffset: '3px',
        cursor: 'text',
        minWidth: '20px',
        display: 'inline-block',
        borderRadius: '4px',
        padding: '0 4px',
        transition: 'all 0.2s',
        ...style
      }}
      className={className}
      title="Cliquer pour éditer le texte directement"
    >
      {text || placeholder}
    </span>
  );
};
`;

if (!content.includes('const EditableText =')) {
  content = content.replace('export default function InstagramCustomClient() {', studioComponents + '\nexport default function InstagramCustomClient() {');
}

// 2. Add custom text blocks support in createDefaultPage
if (!content.includes('customBlocks: []')) {
  content = content.replace('items: [],', 'items: [],\n  customBlocks: [],');
}

// 3. Add helper to add custom text block
const addBlockHelper = `
  const addCustomTextBlock = () => {
    const newBlock = {
      id: 'block_' + Date.now(),
      text: 'Nouveau Texte Libre',
      fontSize: 32,
      color: '#FFFFFF',
      fontWeight: 'bold',
      x: 0,
      y: 0
    };
    const currentBlocks = activePage.customBlocks || [];
    updateActivePage('customBlocks', [...currentBlocks, newBlock]);
  };

  const removeCustomTextBlock = (id) => {
    const currentBlocks = (activePage.customBlocks || []).filter(b => b.id !== id);
    updateActivePage('customBlocks', currentBlocks);
  };

  const updateCustomTextBlock = (id, updates) => {
    const currentBlocks = (activePage.customBlocks || []).map(b => b.id === id ? { ...b, ...updates } : b);
    updateActivePage('customBlocks', currentBlocks);
  };
`;

if (!content.includes('const addCustomTextBlock =')) {
  content = content.replace('const handleItemImageUpload =', addBlockHelper + '\n  const handleItemImageUpload =');
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Added Studio components & custom blocks support to InstagramCustomClient.js!");
