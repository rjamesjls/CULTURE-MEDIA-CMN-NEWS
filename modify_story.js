const fs = require('fs');
const file = 'src/app/admin/(dashboard)/articles/[id]/story/page.js';
let content = fs.readFileSync(file, 'utf8');

// The file might be a server component or client component.
// Wait! `story/page.js` uses `useState`, it's a client component!
if (!content.includes('import SocialTabs')) {
  content = content.replace(/import \{ publishStoryToMeta \} from '\.\/story-actions';/, "import { publishStoryToMeta } from './story-actions';\nimport SocialTabs from '../SocialTabs';");
  
  // Replace the h1 with SocialTabs
  content = content.replace(/<h1 style=\{\{ fontSize: '24px', marginBottom: '20px' \}\}>Format Story \(IA\)<\/h1>/, '<SocialTabs articleId={article?.id || "draft"} />');
  
  fs.writeFileSync(file, content);
}
