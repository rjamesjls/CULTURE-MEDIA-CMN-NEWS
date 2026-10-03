const fs = require('fs');
const filePath = 'src/app/admin/(dashboard)/instagram/custom/InstagramCustomClient.js';
let content = fs.readFileSync(filePath, 'utf-8');

// Helper function to pre-convert all images in a node to Base64
const preloaderFunction = `
const convertImagesToBase64 = async (containerNode) => {
  if (!containerNode) return;
  const imgs = containerNode.querySelectorAll('img');
  const tasks = Array.from(imgs).map(async (img) => {
    const src = img.getAttribute('src');
    if (!src || src.startsWith('data:')) return;
    try {
      const res = await fetch(src);
      if (!res.ok) return;
      const blob = await res.blob();
      await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result && typeof reader.result === 'string') {
            img.src = reader.result;
          }
          resolve();
        };
        reader.onerror = resolve;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.warn("Base64 image conversion warning:", err);
    }
  });
  await Promise.all(tasks);
};
`;

// Prepend helper after getProxiedImageUrl
if (!content.includes('const convertImagesToBase64 =')) {
  content = content.replace('const getProxiedImageUrl =', preloaderFunction + '\nconst getProxiedImageUrl =');
}

// Call convertImagesToBase64 inside handleDownloadAll right before htmlToImage
const oldCaptureCall = `        let dataUrl;
        try {
          dataUrl = await htmlToImage.toJpeg(node, {`;

const newCaptureCall = `        // Pre-convert all remote images to Base64 data URLs for 100% perfect canvas rendering
        await convertImagesToBase64(node);

        let dataUrl;
        try {
          dataUrl = await htmlToImage.toJpeg(node, {`;

if (content.includes(oldCaptureCall)) {
  content = content.replace(oldCaptureCall, newCaptureCall);
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Added Base64 image preloader successfully!");
