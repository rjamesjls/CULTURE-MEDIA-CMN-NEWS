const { spawn } = require('child_process');
const ytDlpPath = require('youtube-dl-exec').constants.YOUTUBE_DL_PATH;
const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
console.log('Path:', ytDlpPath);
const yt = spawn(ytDlpPath, [url, '-o', '-', '-f', 'best']);
let size = 0;
yt.stdout.on('data', chunk => {
  size += chunk.length;
});
yt.stderr.on('data', chunk => console.error(chunk.toString()));
yt.on('close', code => console.log('Done with code', code, 'downloaded:', size));
