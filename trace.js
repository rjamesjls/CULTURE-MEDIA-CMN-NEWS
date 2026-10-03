const fs = require('fs');
let content = fs.readFileSync('src/app/admin/(dashboard)/flash-generator/FlashGeneratorClient.js', 'utf8');

const c2 = content.indexOf('{/* COLUMN 2: SETTINGS */}');
const c1 = content.indexOf('{/* COLUMN 1: TEXT */}');
let block2 = content.substring(c2, c1);
let depth = 0;
block2.split('\n').forEach((line, i) => {
  const openCount = (line.match(/<div/g) || []).length;
  const closeCount = (line.match(/<\/div>/g) || []).length;
  depth += (openCount - closeCount);
  console.log(i + 1, depth, line.trim());
});
