const youtubedl = require('youtube-dl-exec');
const fs = require('fs');

const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
const subprocess = youtubedl.exec(url, {
  output: '-',
  format: 'best'
}, { stdio: ['ignore', 'pipe', 'ignore'] });

let size = 0;
subprocess.stdout.on('data', chunk => {
  size += chunk.length;
});
subprocess.on('close', () => console.log('Done, downloaded bytes:', size));
