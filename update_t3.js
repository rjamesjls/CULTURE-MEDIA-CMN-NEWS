const fs = require('fs');
const file = 'src/app/admin/(dashboard)/articles/[id]/social/SocialGenerator.js';
let content = fs.readFileSync(file, 'utf8');

// Find start of renderTemplate3
const t3Start = content.indexOf('const renderTemplate3');

// 1 & 2 & 3 & 4: Replace background CSS
let beforeBg = content.substring(0, t3Start);
let afterBg = content.substring(t3Start);

afterBg = afterBg.replace(
  `        backgroundColor: "#06038D", // Deep blue background\n        background: "linear-gradient(180deg, #010023 0%, #06038D 25%, #0A11DE 100%)",`,
  `        backgroundColor: "#010023",\n        backgroundImage: "url('/backgrounds/bg-template-bsh.png')",\n        backgroundSize: "cover",\n        backgroundPosition: "center -25px",`
);

// 5: Remove radial-gradient
afterBg = afterBg.replace(
  `      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0.05, backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>`,
  ``
);

// 6: Add paddingBottom to Content Area
afterBg = afterBg.replace(
  `padding: "30px 40px", flex: 1, zIndex: 10, display: "flex", flexDirection: "column", overflow: "hidden"`,
  `padding: "30px 40px", paddingBottom: "180px", flex: 1, zIndex: 10, display: "flex", flexDirection: "column", overflow: "hidden"`
);

// 7: Replace Footer and Quote Line
const quoteStart = `{/* Quote Line */}`;
const t3End = `      </div>
    </div>
  );
  }`;

const qIndex = afterBg.indexOf(quoteStart);
const eIndex = afterBg.indexOf(t3End, qIndex) + t3End.length;

const replacement = `{/* Footer Source Text (absolute positioned over background) */}
      <div style={{ position: "absolute", bottom: "110px", left: "280px", zIndex: 20 }}>
        <div style={{ color: "#fff", fontSize: "18px", fontWeight: "bold" }}>
          {currentData.source || "A FOLUKU TV"}
        </div>
      </div>
    </div>
  );
  }`;

afterBg = afterBg.substring(0, qIndex) + replacement + afterBg.substring(eIndex);

fs.writeFileSync(file, beforeBg + afterBg);
