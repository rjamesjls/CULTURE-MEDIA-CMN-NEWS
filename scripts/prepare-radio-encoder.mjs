import { mkdir, copyFile, writeFile } from 'node:fs/promises';
const target = new URL('../public/afoluku-radio/encoder/', import.meta.url);
await mkdir(target, { recursive: true });
for (const file of ['worker.js', 'const.js', 'errors.js']) {
 await copyFile(new URL(`../node_modules/@ffmpeg/ffmpeg/dist/esm/${file}`, import.meta.url), new URL(file, target));
}
for (const file of ['ffmpeg-core.js', 'ffmpeg-core.wasm']) {
 await copyFile(new URL(`../node_modules/@ffmpeg/core/dist/esm/${file}`, import.meta.url), new URL(file, target));
}
await writeFile(new URL('NOTICE.txt', target), 'FFmpeg.wasm core 0.12.10 — GPL-2.0-or-later. Source, license and build scripts: https://github.com/ffmpegwasm/ffmpeg.wasm/tree/v0.12.10\nFFmpeg.wasm wrapper — MIT. https://github.com/ffmpegwasm/ffmpeg.wasm\n');

for (const file of ['ffmpeg-GPL-2.0.txt', 'ffmpeg-wrapper-MIT.txt']) {
 await copyFile(new URL(`./licenses/${file}`, import.meta.url), new URL(file, target));
}
