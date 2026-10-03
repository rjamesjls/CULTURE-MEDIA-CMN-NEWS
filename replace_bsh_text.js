const fs = require('fs');
const file = 'src/app/admin/(dashboard)/articles/[id]/social/SocialGenerator.js';
let content = fs.readFileSync(file, 'utf8');

const t3Start = content.indexOf('const renderTemplate3');

let beforeT3 = content.substring(0, t3Start);
let afterT3 = content.substring(t3Start);

// Change title color from #ffce00 to #0d069b and remove textShadow
afterT3 = afterT3.replace(
  `            color: "#ffce00",\n            fontSize: "42px",\n            fontWeight: "900",\n            textTransform: "uppercase",\n            lineHeight: "1.1",\n            marginBottom: "20px",\n            textShadow: "2px 2px 4px rgba(0,0,0,0.5)"`,
  `            color: "#0d069b",\n            fontSize: "42px",\n            fontWeight: "900",\n            textTransform: "uppercase",\n            lineHeight: "1.1",\n            marginBottom: "20px"`
);

// Change body text color from #fff to #0d069b and remove textShadow
afterT3 = afterT3.replace(
  `            color: "#fff",\n            fontSize: "26px",\n            lineHeight: "1.4",\n            fontWeight: "500",\n            marginBottom: "30px",\n            textShadow: "1px 1px 3px rgba(0,0,0,0.5)"`,
  `            color: "#0d069b",\n            fontSize: "26px",\n            lineHeight: "1.4",\n            fontWeight: "600",\n            marginBottom: "30px"`
);

fs.writeFileSync(file, beforeT3 + afterT3);
