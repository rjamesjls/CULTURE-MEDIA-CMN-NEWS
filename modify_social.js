const fs = require('fs');
const file = 'src/app/admin/(dashboard)/articles/[id]/social/SocialGenerator.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/import \{ useRouter \} from \"next\/navigation\";/, 'import { useRouter } from "next/navigation";\nimport SocialTabs from "../SocialTabs";');

// Remove existing style overrides
content = content.replace(/<style>\{\`[\s\S]*?\.admin-wrapper \{[\s\S]*?\}\n\s*\`\}<\/style>/, '');

// Replace the page header
content = content.replace(/<div style=\{pageHeaderStyle\}>[\s\S]*?<\/div>\n\s*<\/div>/, '<SocialTabs articleId={article.id} />');

fs.writeFileSync(file, content);
