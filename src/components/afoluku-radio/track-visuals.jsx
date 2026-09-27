'use client';
import { useLayoutEffect, useEffect, useId, useState, useRef, useMemo } from 'react';
import { Music2, AudioLines, Video } from 'lucide-react';
export function TrackArtwork({ src, type = 'image', animate = false, title = '', className = '' }) {
    const [failedSrc, setFailedSrc] = useState(null);
    const failed=!!src&&failedSrc===src;
    const video = useRef(null);
    useEffect(() => {
        const element = video.current;
        if (!element || type !== 'video')
            return;
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
        let visible = false;
        const update = () => { if (animate && visible && !document.hidden && !reduced.matches)
            void element.play().catch(() => { });
        else
            element.pause(); };
        const observer = new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting || false; update(); });
        observer.observe(element);
        document.addEventListener('visibilitychange', update);
        reduced.addEventListener('change', update);
        return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update); reduced.removeEventListener('change', update); element.pause(); };
    }, [src, type, animate, failed]);
    return <div className={`track-artwork ${className}`}>{src && !failed ? (type === 'video' ? <><video ref={video} src={src} muted loop playsInline preload="metadata" aria-label={title ? `Pochette vidéo de ${title}` : 'Pochette vidéo'} onError={() => setFailedSrc(src)}/><Video className="video-cover-mark" aria-hidden="true"/></> : <img src={src} alt={title ? `Pochette de ${title}` : 'Pochette du morceau'} draggable={false} loading="lazy" onError={() => setFailedSrc(src)}/>) : <Music2 aria-hidden="true"/>}</div>;
}
export function Waveform({ peaks, progress = 0, playback, readPosition, compact = false, label = 'Forme d’onde du morceau' }) {
    const clip = useId().replace(/:/g, '');
    const mask = useRef(null), cursor = useRef(null);
    const shown = useRef({ key: '', value: 0 }), position = useRef(readPosition);
    useLayoutEffect(() => { position.current = readPosition; });
    const duration = playback?.duration || 0, offset = playback?.offset || 0, key = playback?.key || '', paused = !!playback?.paused;
    const value = Math.max(0, Math.min(1, progress));
    const hasPeaks = !!peaks?.length;
    const bars = useMemo(() => peaks?.map((p, i) => { const h = Math.max(1, Math.min(1, Math.max(0, p)) * 62); return <rect key={i} x={i * 512 / peaks.length} y={(64 - h) / 2} width={Math.max(1, 512 / peaks.length - 1.5)} height={h} rx=".8"/>; }), [peaks]);
    useEffect(() => {
        if (!hasPeaks)
            return;
        const clamp = (n) => Math.max(0, Math.min(1, n));
        const paint = (fraction) => { mask.current?.setAttribute('width', String(512 * fraction)); cursor.current?.setAttribute('x1', String(512 * fraction)); cursor.current?.setAttribute('x2', String(512 * fraction)); cursor.current?.setAttribute('opacity', fraction > 0 && fraction < 1 ? '1' : '0'); };
        if (compact || duration <= 0 || paused) {
            paint(value);
            return;
        }
        const anchor = performance.now();
        let previous = anchor, frame = 0;
        if (shown.current.key !== key) {
            shown.current = { key, value: clamp(offset / duration) };
        }
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const draw = (now) => {
            const elapsed = Math.max(0, now - previous) / 1000;
            previous = now;
            const local = position.current?.();
            const target = clamp(local != null && Number.isFinite(local) ? local / duration : (offset + (now - anchor) / 1000) / duration);
            const predicted = clamp(shown.current.value + elapsed / duration);
            // Small clock corrections are blended; new tracks and seeks settle immediately.
            const next = Math.abs(target - predicted) * duration > 3 || reduced ? target : predicted + (target - predicted) * (1 - Math.exp(-elapsed * 6));
            shown.current.value = next;
            paint(next);
        };
        paint(shown.current.value);
        if (reduced) {
            const timer = setInterval(() => draw(performance.now()), 250);
            return () => clearInterval(timer);
        }
        const animate = (now) => { draw(now); frame = requestAnimationFrame(animate); };
        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [hasPeaks, compact, duration, offset, key, value, paused]);
    if (!hasPeaks)
        return compact ? null : <div className="wave-empty"><AudioLines size={18}/><span>Forme d’onde non calculée</span></div>;
    return <svg className={`waveform ${compact ? 'waveform-small' : ''}`} viewBox="0 0 512 64" preserveAspectRatio="none" role="img" aria-label={`${label}${value ? `, progression ${Math.round(value * 100)} %` : ''}`}><title>{label}</title><defs><clipPath id={clip}><rect ref={mask} width="0" height="64"/></clipPath></defs><g className="wave-unplayed">{bars}</g><g className="wave-played" clipPath={`url(#${clip})`}>{bars}</g><line ref={cursor} x1="0" x2="0" y1="0" y2="64" opacity="0" className="wave-cursor"/></svg>;
}
