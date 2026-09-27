import {fileMime} from './track-media.js';

export const MAX_URL_IMPORT_BYTES = 100 * 1024 * 1024;
const extensions = {
    'audio/mpeg': 'mp3', 'audio/mp4': 'm4a', 'audio/wav': 'wav',
    'audio/x-wav': 'wav', 'audio/ogg': 'ogg', 'audio/flac': 'flac',
    'audio/aac': 'aac', 'audio/webm': 'webm', 'video/mp4': 'mp4', 'video/webm': 'webm',
};

export function mediaImportUrl(value) {
    let url;
    try { url = new URL(value.trim()); }
    catch { throw new Error('Collez un lien complet vers un fichier audio ou vidéo.'); }
    if (url.protocol !== 'https:' || url.username || url.password)
        throw new Error('Utilisez un lien HTTPS, sans identifiant ni mot de passe dans l’adresse.');
    if (['youtube.com', 'youtu.be', 'youtube-nocookie.com'].some(host => url.hostname === host || url.hostname.endsWith('.' + host)))
        throw new Error('Un lien YouTube n’est pas un fichier audio. Utilisez le lien direct du fichier original MP3, M4A ou MP4.');
    url.hash = '';
    return url.href;
}

// Download in the admin's browser: no server proxy, credentials, or remote URL stored.
// The regular authenticated upload then stores a permanent copy in the radio library.
export async function downloadMediaUrl(value, {signal, onProgress = () => {}} = {}) {
    const url = mediaImportUrl(value);
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal?.addEventListener('abort', abort, {once: true});
    if (signal?.aborted) controller.abort();
    let timedOut = false, reader;
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, 120000);
    try {
        const response = await fetch(url, {
            signal: controller.signal, credentials: 'omit', mode: 'cors',
            referrerPolicy: 'no-referrer', cache: 'no-store',
        });
        if (!response.ok) throw new Error(`Le fichier est inaccessible (erreur ${response.status}). Vérifiez le lien et son accès public.`);
        const mime = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
        if (mime.startsWith('text/') || mime === 'application/xhtml+xml' || mime === 'application/json')
            throw new Error('Ce lien ouvre une page web. Copiez le lien direct du fichier audio ou vidéo.');
        let filename;
        try { filename = decodeURIComponent(new URL(response.url || url).pathname.split('/').pop() || ''); }
        catch { filename = ''; }
        filename = filename.replace(/[\x00-\x1f/\\]/g, '_').slice(0, 180) || 'Import radio';
        if (!/\.(mp3|m4a|mp4|wav|ogg|flac|aac|webm)$/i.test(filename) && extensions[mime])
            filename += '.' + extensions[mime];
        const mediaType = fileMime({name: filename, type: mime});
        if (!extensions[mediaType]) throw new Error('Format non pris en charge. Utilisez un fichier MP3, M4A, WAV, OGG, FLAC, AAC, MP4 ou WebM.');
        const declaredSize = Number(response.headers.get('content-length'));
        if (declaredSize > MAX_URL_IMPORT_BYTES) throw new Error('Ce fichier dépasse la limite de 100 Mo.');
        if (!response.body) throw new Error('Ce lien ne contient aucun fichier téléchargeable.');
        reader = response.body.getReader();
        const chunks = [];
        let size = 0;
        while (true) {
            const {done, value: chunk} = await reader.read();
            if (done) break;
            size += chunk.byteLength;
            if (size > MAX_URL_IMPORT_BYTES) throw new Error('Ce fichier dépasse la limite de 100 Mo.');
            chunks.push(chunk);
            onProgress(size);
        }
        if (controller.signal.aborted) throw new DOMException('Import annulé', 'AbortError');
        if (!size) throw new Error('Le fichier est vide.');
        return new File(chunks, filename, {type: mediaType});
    } catch (error) {
        if (timedOut) throw new Error('Le téléchargement a pris trop de temps. Réessayez ou importez le fichier depuis votre appareil.');
        if (controller.signal.aborted) throw new DOMException('Import annulé', 'AbortError');
        if (error instanceof TypeError)
            throw new Error('Le lien est inaccessible ou son hébergeur bloque l’import depuis ce site. Téléchargez le fichier sur votre appareil, puis utilisez « Importer audio / vidéo ».');
        throw error;
    } finally {
        controller.abort();
        if (reader) await reader.cancel().catch(() => {});
        clearTimeout(timer);
        signal?.removeEventListener('abort', abort);
    }
}
