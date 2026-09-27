// Tap the broadcast mix before the local monitor volume, never the preview desk.
export function recordMix(desk, { complete, error, limit }, Recorder = globalThis.MediaRecorder) {
    if (!Recorder) throw new Error('L’enregistrement nécessite un navigateur compatible avec MediaRecorder.');
    const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus'].find(type => Recorder.isTypeSupported(type));
    if (!mimeType) throw new Error('Ce navigateur ne propose pas de format d’enregistrement audio compatible.');
    const output = desk.context.createMediaStreamDestination();
    let recorder;
    try { recorder = new Recorder(output.stream, { mimeType, audioBitsPerSecond: 192000 }); }
    catch (e) { output.stream.getTracks().forEach(track => track.stop()); throw e; }
    const chunks = [];
    let size = 0, released = false;
    function release() {
        if (released) return;
        released = true;
        desk.mix.disconnect(output);
        output.stream.getTracks().forEach(track => track.stop());
    }
    function stop() { if (recorder.state !== 'inactive') recorder.stop(); }
    recorder.ondataavailable = event => {
        if (!event.data.size) return;
        chunks.push(event.data); size += event.data.size;
        if (size >= 256 * 1024 * 1024 && recorder.state !== 'inactive') {
            limit('La prise a atteint 256 Mo : téléchargez-la puis lancez une nouvelle prise.');
            stop();
        }
    };
    recorder.onerror = () => { error('L’enregistrement a été interrompu. Téléchargez la partie récupérée si elle est disponible.'); stop(); };
    recorder.onstop = () => {
        release();
        const type = recorder.mimeType || mimeType;
        complete(new Blob(chunks, { type }), type.includes('mp4') ? 'm4a' : type.includes('ogg') ? 'ogg' : 'webm');
        chunks.length = 0;
    };
    desk.mix.connect(output);
    try { recorder.start(1000); } catch (e) { release(); throw e; }
    return { stop };
}
