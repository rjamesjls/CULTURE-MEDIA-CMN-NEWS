function box(ctx, video, x, y, w, h, label, decor) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, decor ? 18 : 0);
  ctx.clip();
  ctx.fillStyle = "#101c35";
  ctx.fillRect(x, y, w, h);
  if (video && video.readyState >= 2 && video.videoWidth) {
    const scale = Math.min(w / video.videoWidth, h / video.videoHeight);
    const vw = video.videoWidth * scale, vh = video.videoHeight * scale;
    ctx.drawImage(video, x + (w - vw) / 2, y + (h - vh) / 2, vw, vh);
  } else {
    ctx.fillStyle = "#9aa9c5";
    ctx.font = "500 26px 'Afoluku Poppins', Arial";
    ctx.textAlign = "center";
    ctx.fillText("Cam\xE9ra en attente", x + w / 2, y + h / 2);
    ctx.textAlign = "left";
  }
  if (decor) {
    ctx.fillStyle = "#080f26e8";
    ctx.fillRect(x, y + h - 62, w, 62);
    ctx.fillStyle = "#ffd21c";
    ctx.font = "bold 25px 'Afoluku Poppins', Arial";
    ctx.fillText(label.slice(0, 45), x + 24, y + h - 22, w - 48);
  }
  ctx.restore();
}
function drawInterview(ctx, host, guest, look) {
  const { scene, decor } = look;
  ctx.fillStyle = decor ? "#080f26" : "#000";
  ctx.fillRect(0, 0, 1920, 1080);
  const pad = decor ? 48 : 0, top = decor ? 158 : 0, bottom = decor ? 80 : 0, w = 1920 - pad * 2, h = 1080 - top - bottom, gap = decor ? 24 : 0;
  if (scene === "split") {
    box(ctx, host, pad, top, (w - gap) / 2, h, look.host, decor);
    box(ctx, guest, pad + (w + gap) / 2, top, (w - gap) / 2, h, look.guest, decor);
  } else {
    box(ctx, scene === "guest" ? guest : host, pad, top, w, h, scene === "guest" ? look.guest : look.host, decor);
    if (scene === "pip") box(ctx, guest, 1920 - pad - 500, top + h - 320, 480, 300, look.guest, decor);
  }
  if (decor) {
    ctx.fillStyle = "#ffd21c";
    ctx.font = "900 38px 'Afoluku Montserrat', Arial";
    ctx.fillText("AFOLUKU TV", 48, 64);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 37px 'Afoluku Poppins', Arial";
    ctx.fillText(look.title.slice(0, 95), 48, 123, 1700);
    ctx.fillStyle = "#e21c2a";
    ctx.beginPath();
    ctx.roundRect(1600, 30, 272, 46, 10);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "900 23px 'Afoluku Montserrat', Arial";
    ctx.fillText("INTERVIEW", 1665, 62);
    ctx.fillStyle = "#d4def2";
    ctx.font = "20px 'Afoluku Poppins', Arial";
    ctx.fillText("A MEDIA FU WI", 48, 1040);
    ctx.textAlign = "right";
    ctx.fillText("WI MEDIA, WI KULTURU, WI TOLI", 1872, 1040);
    ctx.textAlign = "left";
    if (look.overlay?.complete && look.overlay.naturalWidth) ctx.drawImage(look.overlay, 0, 0, 1920, 1080);
  }
}
async function openTakes() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("afoluku-interviews", 2);
    req.onupgradeneeded = () => {for(const name of ["takes","scenes"])if(!req.result.objectStoreNames.contains(name))req.result.createObjectStore(name,{keyPath:"id"});};
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function takes(action, value, storeName="takes") {
  const db = await openTakes();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, action === "list" ? "readonly" : "readwrite");
    const store = tx.objectStore(storeName);
    let result = [];
    if (action === "save") store.put(value);
    else if (action === "delete") store.delete(value);
    else {
      const req = store.getAll();
      req.onsuccess = () => {
        result = req.result;
      };
    }
    tx.oncomplete = () => {
      db.close();
      resolve(result.sort((a, b) => b.created - a.created));
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}
export {
  drawInterview,
  openTakes,
  takes
};
