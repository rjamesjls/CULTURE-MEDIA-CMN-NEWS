const fs = require('fs');
const file = 'src/app/admin/(dashboard)/articles/[id]/social/SocialGenerator.js';
let content = fs.readFileSync(file, 'utf8');

const targetStart = `{/* Quote Line */}`;
const targetEnd = `      </div>
    </div>
  );
  }`;

const startIndex = content.indexOf(targetStart, content.indexOf('renderTemplate2'));
const endIndex = content.indexOf(targetEnd, startIndex) + targetEnd.length;

const replacement = `{/* Footer Source Text (absolute positioned over background) */}
      <div style={{ position: "absolute", bottom: "85px", left: "220px", zIndex: 20 }}>
        <div style={{ color: "#fff", fontSize: "18px", fontWeight: "bold" }}>
          {currentData.source || "A FOLUKU TV"}
        </div>
      </div>
    </div>
  );
  }`;

content = content.substring(0, startIndex) + replacement + content.substring(endIndex);

fs.writeFileSync(file, content);
