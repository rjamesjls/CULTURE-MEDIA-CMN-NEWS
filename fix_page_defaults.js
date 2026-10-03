const fs = require('fs');
const filePath = 'src/app/admin/(dashboard)/instagram/custom/InstagramCustomClient.js';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add ensurePageDefaults helper
const ensureHelper = `
const ensurePageDefaults = (page) => {
  if (!page) return createDefaultPage();
  return {
    ...createDefaultPage(),
    ...page,
    tag: page.tag ?? 'NOUVEAUTÉ',
    title: page.title ?? 'TITRE',
    content: page.content ?? '',
    partnerText: page.partnerText ?? 'STARPLAY MUSIC',
    bgImage: page.bgImage ?? '',
    themeColor: page.themeColor ?? '#D32F2F',
    logoType: page.logoType ?? 'white',
    logoVersion: page.logoVersion ?? 'new',
    logoPosition: page.logoPosition ?? 'top-center',
    highlightColor: page.highlightColor ?? '#FBBF24',
    footerText: page.footerText ?? 'CULTURE MEDIA',
    titleSize: page.titleSize ?? 90,
    contentSize: page.contentSize ?? 42,
    tagSize: page.tagSize ?? 28,
    items: page.items ?? [],
    socials: { instagram: true, youtube: false, tiktok: false, ...(page.socials || {}) }
  };
};
`;

if (!content.includes('const ensurePageDefaults =')) {
  content = content.replace('export default function InstagramCustomClient() {', ensureHelper + '\nexport default function InstagramCustomClient() {');
}

// 2. Use ensurePageDefaults for activePage
content = content.replace(
  'const activePage = pages[currentIndex];',
  'const activePage = ensurePageDefaults(pages[currentIndex]);'
);

// 3. Ensure parsed pages in useEffect charts export use ensurePageDefaults
content = content.replace(
  'setPages(parsed);',
  'setPages(parsed.map(ensurePageDefaults));'
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Added ensurePageDefaults to InstagramCustomClient.js successfully!");
