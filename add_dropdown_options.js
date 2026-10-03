const fs = require('fs');
const filePath = 'src/app/admin/(dashboard)/instagram/custom/InstagramCustomClient.js';
let content = fs.readFileSync(filePath, 'utf-8');

const targetDropdown = `<select value={activePage.template} onChange={e => updateActivePage('template', e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '15px', fontWeight: 'bold' }}>
                <option value="t1">Modèle 1 : Classic Premium (Actu)</option>
                <option value="t2">Modèle 2 : Titre Géant (Style MULL)</option>
                <option value="t3">Modèle 3 : Texte Minimal (Citation/Suite)</option>
                <option value="t4">Modèle 4 : Classement Liste (Top 10)</option>
                <option value="t5">Modèle 5 : Grille Prestige Or (Top 10 Galerie)</option>
              </select>`;

const newDropdown = `<select value={activePage.template} onChange={e => updateActivePage('template', e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '15px', fontWeight: 'bold' }}>
                <option value="t1">Modèle 1 : Classic Premium (Actu)</option>
                <option value="t2">Modèle 2 : Titre Géant (Style MULL)</option>
                <option value="t3">Modèle 3 : Texte Minimal (Citation/Suite)</option>
                <option value="t4">Modèle 4 : Classement Liste (Top 10)</option>
                <option value="t5">Modèle 5 : Grille Prestige Or (Top 10 Galerie 5x2)</option>
                <option value="t6">Modèle 6 : Cyber Tech Neon (4 Colonnes Biseautées - Style HBR)</option>
                <option value="t7">Modèle 7 : Web3 Glassmorphism (Halo Néon & Cartes - Style Crypto)</option>
                <option value="t8">Modèle 8 : Purple Rocket Pop (Duo/Trio Cartes Event - Style Tech)</option>
              </select>`;

if (content.includes(targetDropdown)) {
  content = content.replace(targetDropdown, newDropdown);
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log("Replaced dropdown options successfully!");
} else {
  console.error("Target dropdown string not found!");
}
