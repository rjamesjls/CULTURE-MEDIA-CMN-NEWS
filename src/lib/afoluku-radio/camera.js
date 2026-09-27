// Camera permission is requested only after the operator explicitly clicks Preview.
export class RadioCamera {
    stream = null;
    generation = 0;
    async prepare() {
        const generation = ++this.generation;
        this.release();
        if (!navigator.mediaDevices?.getUserMedia)
            throw new Error('La caméra nécessite une connexion HTTPS et un navigateur compatible.');
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 24, max: 30 } }, audio: false });
        if (generation !== this.generation) {
            stream.getTracks().forEach(track => track.stop());
            return null;
        }
        this.stream = stream;
        return stream;
    }
    release() { this.stream?.getTracks().forEach(track => track.stop()); this.stream = null; }
    stop() { this.generation++; this.release(); }
}
