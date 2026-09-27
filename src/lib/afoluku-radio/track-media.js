export const PEAK_COUNT = 128;
export const isVideo = (mime) => !!mime?.startsWith('video/');
export function fileMime(file) {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (ext === 'webm')
        return file.type === 'audio/webm' ? 'audio/webm' : 'video/webm';
    return { mp3: 'audio/mpeg', m4a: 'audio/mp4', mp4: 'video/mp4', wav: 'audio/wav', ogg: 'audio/ogg', flac: 'audio/flac', aac: 'audio/aac' }[ext] || file.type;
}
export function videoType(data) {
    const b = new Uint8Array(data);
    if (b.length < 16)
        return null;
    const text = (start, end) => String.fromCharCode(...b.slice(start, end));
    if (text(4, 8) === 'ftyp' && ['isom', 'iso2', 'iso3', 'iso4', 'iso5', 'iso6', 'iso7', 'iso8', 'iso9', 'mp41', 'mp42', 'avc1', 'M4V ', 'dash', 'cmfc'].includes(text(8, 12)))
        return 'video/mp4';
    if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3 && text(4, Math.min(b.length, 256)).includes('webm'))
        return 'video/webm';
    return null;
}
// Maximum absolute amplitude in each time bucket, across every channel.
export function samplePeaks(channels, count = PEAK_COUNT) {
    if (!channels.length || !channels[0].length)
        return [];
    if (!Number.isInteger(count) || count < 1 || count > 256)
        throw new Error('Nombre de points invalide.');
    const length = channels[0].length;
    const values = [];
    for (let bucket = 0; bucket < count; bucket++) {
        const start = Math.floor(bucket * length / count);
        const end = Math.min(length, Math.max(start + 1, Math.floor((bucket + 1) * length / count)));
        let max = 0;
        for (const channel of channels) {
            for (let i = start; i < end; i++) {
                const n = Math.abs(channel[i] || 0);
                if (Number.isFinite(n))
                    max = Math.max(max, n);
            }
        }
        values.push(Math.round(Math.min(1, max) * 10000) / 10000);
    }
    return values;
}
export function validPeaks(value) { return Array.isArray(value) && value.length === PEAK_COUNT && value.every(n => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1); }
export function imageType(data) { const b = new Uint8Array(data); if (b.length < 12)
    return null; if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff)
    return 'image/jpeg'; if ([137, 80, 78, 71, 13, 10, 26, 10].every((n, i) => b[i] === n))
    return 'image/png'; const text = (start, end) => String.fromCharCode(...b.slice(start, end)); if (text(0, 4) === 'RIFF' && text(8, 12) === 'WEBP')
    return 'image/webp'; return null; }
export async function analyzeWaveform(file, duration) {
    if (duration > 1200)
        throw new Error('Forme d’onde disponible pour les morceaux de 20 minutes maximum. L’audio reste utilisable.');
    if (typeof OfflineAudioContext === 'undefined')
        throw new Error('Ce navigateur ne permet pas l’analyse audio.');
    const context = new OfflineAudioContext(1, 1, 8000);
    const buffer = await context.decodeAudioData(await file.arrayBuffer());
    return samplePeaks(Array.from({ length: buffer.numberOfChannels }, (_, i) => buffer.getChannelData(i)));
}
