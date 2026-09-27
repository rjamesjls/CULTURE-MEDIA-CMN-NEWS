// Network jitter must not repeatedly seek a song that is already playing.
// Deliberate studio seeks change the occurrence key and bypass this filter.
export class PlaybackClock {
    drift = null;
    reset() { this.drift = null; }
    align(media, position, force = false, now = performance.now()) {
        if (media.defaultPlaybackRate !== 1) media.defaultPlaybackRate = 1;
        if (media.playbackRate !== 1) media.playbackRate = 1;
        if (!Number.isFinite(position) || position < 0) return;
        const delta = position - media.currentTime;
        if (force) {
            this.reset();
            if (Math.abs(delta) > .05) media.currentTime = position;
            return;
        }
        if (media.seeking || media.readyState < 3 || Math.abs(delta) <= 3) {
            this.reset();
            return;
        }
        const direction = Math.sign(delta);
        if (!this.drift || this.drift.direction !== direction) {
            this.drift = { direction, since: now, samples: 1 };
            return;
        }
        this.drift.samples++;
        // A single delayed response cannot rewind/skip the music. Confirm a
        // persistent drift for five seconds before one reposition at normal speed.
        if (this.drift.samples >= 3 && now - this.drift.since >= 5000) {
            media.currentTime = position;
            this.reset();
        }
    }
}
