const fs = require('fs');
const file = 'src/app/admin/(dashboard)/layout.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /<Link href=\"\/admin\/instagram\" className=\"admin-nav-link\" style=\{\{ background: 'linear-gradient\\(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%\\)', color: 'white', fontWeight: 'bold' \}\}>\n\s*<i className=\"fab fa-instagram\"><\/i> Posts Instagram\n\s*<\/Link>/g,
  `<Link href="/admin/instagram" className="admin-nav-link" style={{ background: 'linear-gradient(45deg, #1e3a8a 0%, #3b82f6 50%, #8b5cf6 100%)', color: 'white', fontWeight: 'bold' }}>\n            <i className="fas fa-share-nodes"></i> Social Post\n          </Link>`
);

fs.writeFileSync(file, content);
