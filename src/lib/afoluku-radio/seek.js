// Accept total seconds or minutes:seconds without silently accepting malformed input.
export function parsePosition(text) {
    const value = String(text).trim();
    if (/^\d+(?:\.\d+)?$/.test(value)) return Number(value);
    if (/^\d+:[0-5]\d(?:\.\d+)?$/.test(value)) {
        const [minutes, seconds] = value.split(':').map(Number);
        return minutes * 60 + seconds;
    }
    return NaN;
}
export function seekLocal(media, request) {
    if (!media || !Number.isFinite(media.duration) || media.duration <= 0)
        throw new Error('Patientez pendant le chargement du titre.');
    const value = request.delta !== undefined ? media.currentTime + request.delta : request.position;
    if (!Number.isFinite(value)) throw new Error('Position invalide.');
    media.currentTime = Math.max(0, Math.min(media.duration - 0.05, value));
}
