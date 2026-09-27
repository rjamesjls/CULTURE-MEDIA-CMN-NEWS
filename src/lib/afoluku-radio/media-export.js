// The encoder runs locally in a disposable worker: recordings never leave the browser.
export async function encodeRadioMedia({ blob, url, format, start, end, signal, onProgress }) {
 const aborted = () => new DOMException('Export annulé.', 'AbortError');
 if (signal?.aborted) throw aborted();
 const { FFmpeg } = await import('@ffmpeg/ffmpeg');
 const encoder = new FFmpeg();
 const cancel = () => encoder.terminate();
 signal?.addEventListener('abort', cancel, { once: true });
 try {
  if (signal?.aborted) throw aborted();
  const base = new URL('/afoluku-radio/encoder/', window.location.origin).href;
  await encoder.load({ classWorkerURL: `${base}worker.js`, coreURL: `${base}ffmpeg-core.js`, wasmURL: `${base}ffmpeg-core.wasm` });
  if (!blob) {
   const response = await fetch(url, { signal });
   if (!response.ok) throw new Error('Impossible de charger le média pour l’export.');
   const limit = 256 * 1024 * 1024;
   if (Number(response.headers.get('content-length')) > limit) throw new Error('Le média dépasse 256 Mo.');
   blob = await response.blob();
  }
  if (blob.size > 256 * 1024 * 1024) throw new Error('Le média dépasse 256 Mo.');
  if (signal?.aborted) throw aborted();
  await encoder.writeFile('input', new Uint8Array(await blob.arrayBuffer()));
  const output = format === 'mp3' ? 'output.mp3' : 'output.mp4';
  encoder.on('progress', ({ progress }) => onProgress?.(Math.max(0, Math.min(0.99, progress))));
  const range = Number.isFinite(start) && Number.isFinite(end) ? ['-ss', String(start), '-t', String(end - start)] : [];
  const codec = format === 'mp3'
   ? ['-map', '0:a:0', '-vn', '-c:a', 'libmp3lame', '-b:a', '192k']
   : ['-map', '0:v:0', '-map', '0:a:0', '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart'];
  const exit = await encoder.exec(['-i', 'input', ...range, ...codec, '-threads', '1', output]);
  if (exit !== 0) throw new Error('L’encodage a échoué. Essayez un extrait plus court.');
  const data = await encoder.readFile(output);
  if (signal?.aborted) throw aborted();
  onProgress?.(1);
  return { blob: new Blob([data], { type: format === 'mp3' ? 'audio/mpeg' : 'video/mp4' }), extension: format === 'mp3' ? 'mp3' : 'mp4' };
 } catch (error) {
  if (signal?.aborted) throw aborted();
  throw new Error(`Export impossible : ${error?.message || 'mémoire insuffisante ou encodeur indisponible. Réessayez avec un extrait plus court.'}`);
 } finally {
  signal?.removeEventListener('abort', cancel);
  encoder.terminate();
 }
}
