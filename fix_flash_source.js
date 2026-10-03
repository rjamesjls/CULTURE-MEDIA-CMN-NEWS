const fs = require('fs');
const file = 'src/app/admin/(dashboard)/articles/[id]/social/SocialGenerator.js';
let content = fs.readFileSync(file, 'utf8');

const sourceFooter = `
        {/* Footer Source Text (absolute positioned over background) */}
        <div style={{ position: "absolute", bottom: "110px", left: "280px", zIndex: 20 }}>
          <div style={{ color: "#fff", fontSize: "18px", fontWeight: "bold" }}>
            {flashData.source || "A FOLUKU TV"}
          </div>
        </div>

        {/* Footer (Breaking News + Lieu) */}
        {renderBreakingNewsBanner()}
`;

content = content.replace(/\{\/\* Footer \(Breaking News \+ Lieu\) \*\/\}\n\s*\{renderBreakingNewsBanner\(\)\}/, sourceFooter);

fs.writeFileSync(file, content);
