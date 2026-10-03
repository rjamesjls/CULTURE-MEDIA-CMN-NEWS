const fs = require('fs');

// 1. Update Template t9 in InstagramCustomClient.js to use EditableText for all text elements
const instaFile = 'src/app/admin/(dashboard)/instagram/custom/InstagramCustomClient.js';
let instaContent = fs.readFileSync(instaFile, 'utf-8');

// Replace static text references in t9 with EditableText
instaContent = instaContent.replace(
  "{renderTextWithHighlights(title || 'SHAPING THE FUTURE WITH IDEAS', highlightColor)}",
  `<EditableText text={title || 'SHAPING THE FUTURE WITH IDEAS'} onChange={(val) => updateActivePage('title', val)} style={{ color: '#FFF' }} />`
);

instaContent = instaContent.replace(
  "{activePage.items && activePage.items[0]?.title ? activePage.items[0].title : (partnerText || 'Dr. Aminu Yusuf')}",
  `<EditableText text={activePage.items && activePage.items[0]?.title ? activePage.items[0].title : (partnerText || 'Dr. Aminu Yusuf')} onChange={(val) => updateActivePage('partnerText', val)} style={{ color: '#FFF' }} />`
);

instaContent = instaContent.replace(
  "{activePage.items && activePage.items[0]?.subtitle ? activePage.items[0].subtitle : (content || '(AI Specialist)')}",
  `<EditableText text={activePage.items && activePage.items[0]?.subtitle ? activePage.items[0].subtitle : (content || '(AI Specialist)')} onChange={(val) => updateActivePage('content', val)} style={{ color: '#CBD5E1' }} />`
);

instaContent = instaContent.replace(
  "{tag || 'Eko Convention Centre, Lagos'}",
  `<EditableText text={tag || 'Eko Convention Centre, Lagos'} onChange={(val) => updateActivePage('tag', val)} style={{ color: '#FFF' }} />`
);

instaContent = instaContent.replace(
  "➔ Register at; {footerText || 'www.innovatex.com'}",
  `➔ Register at; <EditableText text={footerText || 'www.innovatex.com'} onChange={(val) => updateActivePage('footerText', val)} style={{ color: '#F472B6' }} />`
);

fs.writeFileSync(instaFile, instaContent, 'utf-8');
console.log("Updated InstagramCustomClient.js with EditableText on t9!");

// 2. Add EditableText to ReelsStudioClient.js preview overlays
const reelsFile = 'src/app/admin/(dashboard)/reels-studio/ReelsStudioClient.js';
let reelsContent = fs.readFileSync(reelsFile, 'utf-8');

// Add EditableText helper to ReelsStudioClient.js if not already present
const reelsEditableTextHelper = `
// --- CANVA-STYLE INLINE EDITING HELPER ---
const EditableSlideText = ({ text, onLineChange, lineIndex, style = {}, placeholder = 'Écrivez ici...' }) => {
  return (
    <span
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => {
        const lines = (text || '').split('\\n');
        lines[lineIndex] = e.currentTarget.innerText;
        onLineChange(lines.join('\\n'));
      }}
      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.blur(); } }}
      style={{
        outline: '1px dashed rgba(244,114,182,0.6)',
        outlineOffset: '2px',
        cursor: 'text',
        minWidth: '20px',
        display: 'inline-block',
        borderRadius: '3px',
        padding: '0 3px',
        ...style
      }}
      title="Cliquer pour éditer directement sur la vidéo"
    >
      {((text || '').split('\\n')[lineIndex]) || placeholder}
    </span>
  );
};
`;

if (!reelsContent.includes('const EditableSlideText =')) {
  reelsContent = reelsContent.replace('export default function ReelsStudioClient() {', reelsEditableTextHelper + '\nexport default function ReelsStudioClient() {');
}

fs.writeFileSync(reelsFile, reelsContent, 'utf-8');
console.log("Updated ReelsStudioClient.js with EditableSlideText!");
