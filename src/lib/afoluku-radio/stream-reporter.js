export class StreamReporter {
    viewerId;
    sessionId = crypto.randomUUID();
    sequence = 0;
    track = null;
    active = false;
    sentAt = 0;
    constructor(viewerId) { this.viewerId = viewerId; }
    async report(track, now = Date.now(), force = false) {
        const active = !!track, previous = this.track;
        if (!track && !previous)
            return;
        if (!force && active === this.active && track?.key === previous?.key && (!active || now - this.sentAt < 5000))
            return;
        if (!force && !active && !this.active)
            return;
        this.track = track || previous;
        this.active = active;
        this.sentAt = now;
        const sequence = ++this.sequence;
        try {
            const response = await fetch('/api/afoluku-radio/streams', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ viewerId: this.viewerId, sessionId: this.sessionId, sequence, active, trackId: this.track.id, occurrence: this.track.key }), keepalive: true, signal: AbortSignal.timeout(7000) });
            if (!response.ok)
                throw new Error('Stream counter unavailable');
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
