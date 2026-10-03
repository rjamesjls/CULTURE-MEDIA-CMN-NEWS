const ytdl = require('@distube/ytdl-core');
const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
ytdl.getInfo(url).then(info => {
  const format = ytdl.chooseFormat(info.formats, { filter: 'audioandvideo' });
  console.log('Format chosen:', format ? format.itag : 'None');
}).catch(console.error);
