const fs = require('fs');
const file = 'src/app/admin/(dashboard)/articles/[id]/social/SocialGenerator.js';
let content = fs.readFileSync(file, 'utf8');

const styleBlock = `
      <style>{\`
        @import url("https://fonts.googleapis.com/css2?family=Anton&display=swap");
        /* Styles pour Instagram Post (wrap, points clés en jaune et très gras) */
        .insta-body {
          word-break: normal;
          overflow-wrap: break-word;
          white-space: pre-wrap !important;
        }
        .insta-body strong {
          font-weight: 900 !important;
        }
        .insta-body.fr strong {
          color: #ffce00 !important;
        }
        .insta-body.bsh strong {
          color: #e41318 !important; /* Red for better contrast on light background */
        }
        .insta-body ul {
          list-style-type: disc !important;
          padding-left: 40px !important;
          margin-top: 10px !important;
          margin-bottom: 10px !important;
        }
        .insta-body ol {
          list-style-type: decimal !important;
          padding-left: 40px !important;
          margin-top: 10px !important;
          margin-bottom: 10px !important;
        }
        .insta-body li {
          margin-bottom: 8px !important;
          display: list-item !important;
        }
        .insta-title {
          word-break: normal;
          overflow-wrap: break-word;
        }
      \`}</style>
`;

content = content.replace(/<SocialTabs articleId=\{article\.id\} \/>/, styleBlock + '<SocialTabs articleId={article.id} />');

fs.writeFileSync(file, content);
