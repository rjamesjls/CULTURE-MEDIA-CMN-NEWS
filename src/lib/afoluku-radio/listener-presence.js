const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
export function listenerId() {
    try {
        const saved = localStorage.getItem('afoluku-listener');
        if (saved && uuid.test(saved))
            return saved;
        const id = crypto.randomUUID();
        localStorage.setItem('afoluku-listener', id);
        return id;
    }
    catch {
        return crypto.randomUUID();
    }
}
export class ListenerPresence {
    viewerId;
    sessionId = crypto.randomUUID();
    sequence = 0;
    active = false;
    sentAt = 0;
    constructor(viewerId) { this.viewerId = viewerId; }
    async report(active, now = Date.now(), force = false) {
        if (!force && active === this.active && (!active || now - this.sentAt < 15000))
            return;
        this.active = active;
        this.sentAt = now;
        const sequence = ++this.sequence;
        try {
            const response = await fetch('/api/afoluku-radio/listeners', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ viewerId: this.viewerId, sessionId: this.sessionId, sequence, active }), keepalive: true, signal: AbortSignal.timeout(7000) });
            if (!response.ok)
                throw new Error('Presence unavailable');
        }
        catch {
            if (sequence === this.sequence) {
                this.sentAt = 0;
                if (!active)
                    this.active = true;
            }
        }
    }
}
