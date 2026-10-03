const play = require('play-dl');
const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
play.stream(url).then(stream => {
  console.log('Stream retrieved:', stream.type);
}).catch(console.error);
