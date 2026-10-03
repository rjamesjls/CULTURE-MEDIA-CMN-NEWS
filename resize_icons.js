const fs = require('fs');
const file = 'src/app/admin/(dashboard)/articles/[id]/social/SocialGenerator.js';
let content = fs.readFileSync(file, 'utf8');

// Replace Broadcast SVG
content = content.replace(
  /<svg width=\"40\" height=\"40\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"white\" strokeWidth=\"2\.5\"/g,
  '<svg width="55" height="55" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"'
);

// Replace Location SVG
content = content.replace(
  /<svg width=\"32\" height=\"32\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0d069b\" strokeWidth=\"3\"/g,
  '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#0d069b" strokeWidth="3"'
);

fs.writeFileSync(file, content);
