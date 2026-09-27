export async function api(url, method = 'GET', data) { const r = await fetch(url, { method, headers: data ? { 'Content-Type': 'application/json' } : undefined, body: data ? JSON.stringify(data) : undefined, cache: 'no-store' }); const result = await r.json(); if (!r.ok)
    throw Object.assign(new Error(result.error || 'La requête a échoué.'), {status: r.status}); return result; }
export function wav(samples, rate) { const buffer = new ArrayBuffer(44 + samples.length * 2); const view = new DataView(buffer); const str = (o, s) => { for (let i = 0; i < s.length; i++)
    view.setUint8(o + i, s.charCodeAt(i)); }; str(0, 'RIFF'); view.setUint32(4, 36 + samples.length * 2, true); str(8, 'WAVEfmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, rate, true); view.setUint32(28, rate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); str(36, 'data'); view.setUint32(40, samples.length * 2, true); for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 32768 : s * 32767, true);
} return buffer; }
// Keep audio and video on one programme clock, with only one media element playing.
class ProgrammeMedia {
    sound = new Audio();
    current = this.sound;
    video;
    constructor(video) { this.video = video; this.sound.crossOrigin = 'anonymous';
        this.sound.volume = 1; this.sound.muted = false; if (video) {
        video.crossOrigin = 'anonymous';
            video.volume = 1;
        video.muted = false;
    } if (video) {
        video.playsInline = true;
        video.preload = 'metadata';
    } }
    get elements() { return this.video ? [this.sound, this.video] : [this.sound]; }
    select(mime) { const wantsVideo = !!mime?.startsWith('video/'); if (wantsVideo && !this.video)
        throw new Error('Le lecteur vidéo n’est pas prêt. Rechargez la page.'); const next = wantsVideo ? this.video : this.sound; if (next === this.current)
        return false; this.current.pause(); this.current = next; return true; }
    connect(context, destination, onEnded, onError) { for (const element of this.elements) {
        context.createMediaElementSource(element).connect(destination);
        element.addEventListener('ended', () => { if (element === this.current)
            onEnded(); });
        element.addEventListener('error', () => { if (element === this.current && element.getAttribute('src'))
            onError(); });
    } }
    destroy() { for (const element of this.elements) {
        element.pause();
        element.removeAttribute('src');
        element.load();
    } }
}
export class AudioDesk {
    context;
    spectrum;
    media;
    get audio() { return this.media.current; }
    music;
    monitor;
    mix;
    micGain;
    analyser;
    stream = null;
    micSource = null;
    worklet = null;
    silent;
    key = '';
    session = null;
    latestState = 0;
    disposed = false;
    previewOperation = 0;
    pending = 0;
    chain = Promise.resolve();
    seq = 0;
    failed = false;
    onError = () => { };
    onPreviewEnd = () => { };
    constructor(video) { this.media = new ProgrammeMedia(video); this.context = new AudioContext(); this.audio.preload = 'auto'; this.music = this.context.createGain(); this.monitor = this.context.createGain(); this.mix = this.context.createGain(); this.spectrum = this.context.createAnalyser(); this.spectrum.fftSize = 2048; this.spectrum.smoothingTimeConstant = .78; this.mix.connect(this.spectrum); this.micGain = this.context.createGain(); this.micGain.gain.value = 0; this.analyser = this.context.createAnalyser(); this.silent = this.context.createGain(); this.silent.gain.value = 0; this.spectrum.connect(this.silent); this.silent.connect(this.context.destination); this.music.connect(this.monitor); this.monitor.connect(this.context.destination); this.monitor.gain.value = .7; this.music.connect(this.mix); this.micGain.connect(this.mix); this.media.connect(this.context, this.music, () => { if (this.key === 'preview') {
        this.key = '';
        this.onPreviewEnd();
        return;
    } if (this.key)
        void api('/api/afoluku-radio/station').then(s => this.sync(s)).catch(e => this.onError(e.message)); }, () => this.onError('Ce fichier ne peut pas être lu. Essayez MP3 pour l’audio ou MP4 H.264/AAC pour la vidéo.')); }
    async resume() { await this.context.resume(); }
    async setMonitor(level) { await this.resume(); this.monitor.gain.value = Math.max(0, Math.min(1, level)); }
    async sync(state) { if (this.disposed || state.serverNow < this.latestState)
        return; this.latestState = state.serverNow; await this.resume(); if (this.disposed || state.serverNow < this.latestState)
        return; const c = state.current; if (!c) {
        if (this.key && this.key !== 'preview') {
            this.audio.pause();
            this.key = '';
        }
        return;
    } const changed = this.media.select(c.mime); if (changed || this.key !== c.key) {
        this.key = c.key;
        this.audio.src = '/api/afoluku-radio/audio/' + c.id;
        this.audio.currentTime = c.offset;
    }
    else if (state.paused || Math.abs(this.audio.currentTime - c.offset) > 3) {
        this.audio.currentTime = c.offset;
    } if (state.paused) {
        this.audio.pause();
        return;
    } if (this.audio.paused)
        await this.audio.play(); }
    async preview(id, mime) { const operation = ++this.previewOperation; this.key = 'preview'; await this.resume(); if (this.disposed || operation !== this.previewOperation)
        return; this.media.select(mime); this.audio.src = '/api/afoluku-radio/audio/' + id; this.audio.currentTime = 0; await this.audio.play(); if (this.disposed || operation !== this.previewOperation)
        this.audio.pause(); }
    stopPreview() { this.previewOperation++; if (this.key === 'preview') {
        this.audio.pause();
        this.key = '';
        this.onPreviewEnd();
    } }
    async prepareMic() { await this.resume(); if (this.stream?.getAudioTracks().some(t => t.readyState === 'live'))
        return; if (!navigator.mediaDevices?.getUserMedia)
        throw new Error('Le microphone nécessite HTTPS et un navigateur compatible.'); this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false }); if (this.disposed) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
        throw new Error('Le studio a été fermé.');
    } this.micSource = this.context.createMediaStreamSource(this.stream); this.micSource.connect(this.analyser); this.setTalking(false); this.stream.getAudioTracks()[0].addEventListener('ended', () => { if (this.session)
        this.onError('Le microphone a été déconnecté.'); }); }
    level() { const values = new Uint8Array(this.analyser.fftSize); this.analyser.getByteTimeDomainData(values); let sum = 0; for (const n of values)
        sum += Math.pow((n - 128) / 128, 2); return Math.min(100, Math.sqrt(sum / values.length) * 280); }
    duckLevel = .22;
    talking = false;
    setDuckLevel(level) { this.duckLevel = Number.isFinite(level) ? Math.max(0, Math.min(1, level)) : .22; if (this.talking)
        this.music.gain.value = this.duckLevel; }
    setTalking(active) { this.talking = active; this.micGain.gain.value = active ? 1 : 0; this.music.gain.value = active ? this.duckLevel : 1; this.stream?.getAudioTracks().forEach(track => { track.enabled = active; }); }
    async startLive(session, talking = true) {
        if (!this.micSource)
            throw new Error('Préparez le microphone avant de prendre l’antenne.');
        await this.context.audioWorklet.addModule('/afoluku-radio/pcm-worklet.js?v=2');
        if (this.disposed)
            throw new Error('Le studio a été fermé.');
        this.session = session;
        this.seq = 0;
        this.pending = 0;
        this.failed = false;
        this.chain = Promise.resolve();
        this.setTalking(talking);
        this.micSource.connect(this.micGain);
        this.worklet = new AudioWorkletNode(this.context, 'radio-pcm');
        this.mix.connect(this.worklet);
        this.worklet.connect(this.silent);
        this.worklet.port.onmessage = e => { if (this.session !== session || this.failed)
            return; const seq = this.seq++; const payload = wav(e.data.samples, e.data.rate); if (++this.pending > 4) {
            this.failed = true;
            this.onError('Connexion trop lente pour le direct. Retour à la programmation.');
            return;
        } this.chain = this.chain.then(async () => { if (this.session !== session || this.failed)
            return; let success = false; for (let attempt = 0; attempt < 2; attempt++) {
            try {
                const r = await fetch(`/api/afoluku-radio/live/${session}/${seq}`, { method: 'PUT', headers: { 'Content-Type': 'audio/wav' }, body: payload, signal: AbortSignal.timeout(7000) });
                if (!r.ok) {
                    const d = await r.json();
                    throw new Error(d.error || 'Envoi audio impossible.');
                }
                success = true;
                break;
            }
            catch (error) {
                if (attempt === 1)
                    throw error;
            }
        } if (success)
            this.pending--; }).catch(error => { if (this.session === session && !this.failed) {
            this.failed = true;
            this.onError(error.message || 'Le direct a été interrompu.');
        } }); };
    }
    stopLive() { this.setTalking(false); this.session = null; if (this.worklet) {
        this.worklet.port.onmessage = null;
        this.worklet.disconnect();
        this.mix.disconnect(this.worklet);
        this.worklet = null;
    } if (this.micSource) {
        try {
            this.micSource.disconnect(this.micGain);
        }
        catch { }
    } this.music.gain.value = 1; }
    closeMic() { this.stopLive(); this.micSource?.disconnect(); this.stream?.getTracks().forEach(t => t.stop()); this.stream = null; this.micSource = null; }
    destroy() { this.disposed = true; this.closeMic(); this.media.destroy(); void this.context.close(); }
}
export class ListenerAudio {
    context = new AudioContext();
    spectrum = this.context.createAnalyser();
    media;
    get audio() { return this.media.current; }
    gain;
    key = '';
    session = '';
    last = -1;
    nextTime = 0;
    sources = new Set();
    generation = 0;
    pending = null;
    draining = null;
    disposed = false;
    latest = 0;
    onError = () => { };
    constructor(video) {
        this.media = new ProgrammeMedia(video);
        this.gain = this.context.createGain();
        this.gain.connect(this.context.destination);
        this.spectrum.fftSize = 2048;
        this.spectrum.smoothingTimeConstant = .78;
        this.spectrum.connect(this.gain);
        this.media.connect(this.context, this.spectrum, () => { if (!this.key)
            return; const generation = this.generation; void api('/api/afoluku-radio/station').then(s => { if (generation === this.generation && !this.disposed)
            return this.sync(s); }).catch(() => { }); }, () => this.onError('Lecture impossible. Utilisez MP3 pour l’audio ou MP4 H.264/AAC pour la vidéo.'));
    }
    isPlaying() { return !this.disposed && this.context.state === 'running' && (this.session ? this.sources.size > 0 && this.nextTime > this.context.currentTime : !!this.key && !this.audio.paused && !this.audio.ended && this.audio.readyState >= 3); }
    async resume() { if (!this.disposed)
        await this.context.resume(); }
    clearLive() { for (const source of this.sources) {
        try {
            source.stop();
        }
        catch { }
    } this.sources.clear(); this.session = ''; this.last = -1; this.nextTime = 0; }
    // Polling and the play button share one decoder; a chunk can only be scheduled once.
    sync(state) {
        if (this.disposed || state.serverNow < this.latest)
            return Promise.resolve();
        this.latest = state.serverNow;
        this.pending = state;
        if (!this.draining)
            this.draining = this.drain();
        return this.draining;
    }
    async drain() {
        try {
            while (this.pending && !this.disposed) {
                const state = this.pending;
                this.pending = null;
                await this.apply(state, this.generation);
            }
        }
        finally {
            this.draining = null;
        }
    }
    async apply(state, generation) {
        const cancelled = () => generation !== this.generation || this.disposed;
        await this.resume();
        if (cancelled())
            return;
        if (state.live) {
            this.audio.pause();
            this.key = '';
            const live = state.live;
            if (live.session !== this.session || live.seq - this.last > 4) {
                this.clearLive();
                this.session = live.session;
                this.last = live.seq - 1;
                this.nextTime = this.context.currentTime + .5;
            }
            const session = this.session;
            for (let seq = this.last + 1; seq <= live.seq; seq++) {
                const r = await fetch(`/api/afoluku-radio/live/${session}/${seq}`, { cache: 'no-store', signal: AbortSignal.timeout(7000) });
                if (cancelled())
                    return;
                if (!r.ok)
                    throw new Error('Le direct se reconnecte…');
                const data = await r.arrayBuffer();
                if (cancelled())
                    return;
                const buffer = await this.context.decodeAudioData(data);
                if (cancelled())
                    return;
                const source = this.context.createBufferSource();
                source.buffer = buffer;
                source.connect(this.spectrum);
                this.nextTime = Math.max(this.nextTime, this.context.currentTime + .1);
                source.start(this.nextTime);
                this.nextTime += buffer.duration;
                this.sources.add(source);
                source.onended = () => { this.sources.delete(source); source.disconnect(); };
                this.last = seq;
            }
            return;
        }
        if (this.session)
            this.clearLive();
        const c = state.current;
        if (!c) {
            this.audio.pause();
            this.key = '';
            return;
        }
        const changed = this.media.select(c.mime);
        if (changed || this.key !== c.key) {
            this.key = c.key;
            this.audio.src = '/api/afoluku-radio/audio/' + c.id;
            this.audio.currentTime = c.offset;
        }
        else if (state.paused || Math.abs(this.audio.currentTime - c.offset) > 3)
            this.audio.currentTime = c.offset;
        if (state.paused) {
            this.audio.pause();
            return;
        }
        if (this.audio.paused)
            try {
                await this.audio.play();
            }
            catch (error) {
                if (!cancelled())
                    throw error;
            }
    }
    stop() { this.generation++; this.pending = null; this.latest = 0; this.clearLive(); this.audio.pause(); this.key = ''; }
    destroy() { this.stop(); this.disposed = true; this.media.destroy(); void this.context.close(); }
}
export async function readFile(file, video = false) {
    const url = URL.createObjectURL(file);
    try {
        return await new Promise((resolve, reject) => {
            const element = video ? document.createElement('video') : new Audio();
            element.preload = 'metadata';
            const clean = () => { clearTimeout(timeout); element.onloadedmetadata = null; element.onerror = null; element.removeAttribute('src'); element.load(); };
            const timeout = setTimeout(() => { clean(); reject(new Error('Lecture du fichier trop longue.')); }, 15000);
            element.onloadedmetadata = () => {
                const duration = element.duration;
                const visible = !video || (element.videoWidth > 0 && element.videoHeight > 0);
                clean();
                if (!visible)
                    reject(new Error('Ce fichier ne contient pas d’image vidéo lisible.'));
                else if (!Number.isFinite(duration) || duration <= 0)
                    reject(new Error('Durée du fichier inconnue.'));
                else
                    resolve(duration);
            };
            element.onerror = () => { clean(); reject(new Error('Fichier non compatible. Pour la vidéo, essayez MP4 H.264/AAC.')); };
            element.src = url;
        });
    }
    finally {
        URL.revokeObjectURL(url);
    }
}
