const fs = require('fs');
const file = 'src/app/admin/(dashboard)/articles/[id]/spinoffs/SpinoffsClient.js';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('import SocialTabs')) {
  content = content.replace(/import Link from 'next\/link';/, "import Link from 'next/link';\nimport SocialTabs from '../SocialTabs';");
  
  content = content.replace(/<div style=\{\{ marginBottom: '20px' \}\}>\n\s*<Link href=\"\/admin\/publication-center\"[\s\S]*?<\/Link>\n\s*<\/div>/, '<SocialTabs articleId={article?.id || "draft"} />');
  
  fs.writeFileSync(file, content);
}
