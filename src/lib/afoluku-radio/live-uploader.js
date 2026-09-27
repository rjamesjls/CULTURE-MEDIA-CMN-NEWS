// A network delay must not close the microphone or end a continuous programme.
// Keep numbered chunks in order, retry the same chunk, and bound memory on outages.
export class LiveUploader {
    queue = [];
    seq = 0;
    running = false;
    stopped = false;
    controller = null;
    retryTimer = null;
    releaseRetry = null;
    warned = false;
    constructor(session, {warning = () => {}, recovered = () => {}, fatal = () => {}} = {}) {
        this.session = session;
        this.warning = warning;
        this.recovered = recovered;
        this.fatal = fatal;
    }
    enqueue(payload) {
        if (this.stopped) return false;
        if (this.queue.length >= 12) {
            this.warned = true;
            this.warning('Connexion saturée : certains passages ne peuvent pas être transmis. Le direct reste actif ; vérifiez votre connexion.');
            return false;
        }
        this.queue.push({seq: this.seq++, payload});
        if (!this.running) void this.pump();
        return true;
    }
    async pump() {
        this.running = true;
        let failures = 0;
        try {
            while (!this.stopped && this.queue.length) {
                const chunk = this.queue[0];
                const controller = new AbortController();
                this.controller = controller;
                const timeout = setTimeout(() => controller.abort(), 7000);
                try {
                    const response = await fetch(`/api/afoluku-radio/live/${this.session}/${chunk.seq}`, {
                        method: 'PUT', headers: {'Content-Type': 'audio/wav'}, body: chunk.payload, signal: controller.signal,
                    });
                    if (this.stopped) return;
                    if ([401, 403, 409].includes(response.status)) {
                        this.stop();
                        this.fatal(response.status === 409 ? 'Cette session de direct a été fermée. Reprenez l’antenne depuis la régie.' : 'Votre autorisation de diffusion a expiré. Reconnectez-vous à la régie.');
                        return;
                    }
                    if (!response.ok) throw new Error('Upload unavailable');
                    this.queue.shift();
                    failures = 0;
                    if (this.warned && this.queue.length < 3) {
                        this.warned = false;
                        this.recovered();
                    }
                } catch {
                    if (this.stopped) return;
                    failures++;
                    this.warned = true;
                    this.warning('Connexion du direct instable : envoi en cours de reprise. Le microphone reste actif.');
                } finally {
                    clearTimeout(timeout);
                    this.controller = null;
                }
                if (failures && !this.stopped) {
                    await new Promise(resolve => {
                        this.releaseRetry = resolve;
                        this.retryTimer = setTimeout(resolve, Math.min(2000, failures * 500));
                    });
                    this.retryTimer = null;
                    this.releaseRetry = null;
                }
            }
        } finally { this.running = false; }
    }
    stop() {
        this.stopped = true;
        this.controller?.abort();
        clearTimeout(this.retryTimer);
        this.releaseRetry?.();
        this.queue = [];
    }
}
