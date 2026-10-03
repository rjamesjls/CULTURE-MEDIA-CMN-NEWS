const fs = require('fs');

let content = fs.readFileSync('src/app/admin/(dashboard)/flash-generator/FlashGeneratorClient.js', 'utf8');

// The file currently has duplicate renderTemplate and the right column is missing or broken.
// I will just write a clean script to generate the correct file contents and overwrite it.
