const fs = require('fs');
const file = 'src/app/admin/(dashboard)/articles/[id]/story/page.js';
let content = fs.readFileSync(file, 'utf8');

// The file might be a server component or client component.
if (!content.includes('import SocialTabs')) {
  content = content.replace(/import \{ notFound \} from 'next\/navigation';/, "import { notFound } from 'next/navigation';\nimport SocialTabs from '../SocialTabs';");
  
  content = content.replace(/<div style=\{\{ marginBottom: '20px' \}\}>\n\s*<Link href=\"\/admin\/publication-center\"[\s\S]*?<\/Link>\n\s*<\/div>/, '<SocialTabs articleId={articleId || "draft"} />');
  
  fs.writeFileSync(file, content);
}
