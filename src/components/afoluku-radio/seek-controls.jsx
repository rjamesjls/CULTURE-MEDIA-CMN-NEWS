'use client';
import { useEffect, useRef, useState } from 'react';
import { seconds } from '@/lib/afoluku-radio/radio';
import { parsePosition } from '@/lib/afoluku-radio/seek';

export default function SeekControls({ label, duration, readPosition, disabled, onSeek }) {
    const [position, setPosition] = useState(0);
    const [draft, setDraft] = useState(null);
    const pending = useRef(null);
    const [target, setTarget] = useState('');
    const [error, setError] = useState('');
    useEffect(() => {
        const update = () => setPosition(Math.max(0, readPosition() || 0));
        const timer = setInterval(update, 250);
        return () => clearInterval(timer);
    }, [readPosition]);
    function commitPosition() {
        const value = pending.current;
        pending.current = null;
        setDraft(null);
        if (disabled || value === null) return;
        const next = Math.max(0, Math.min(duration - 0.05, value));
        setPosition(next);
        setError('');
        onSeek({ position: next });
    }
    function cancelPosition() { pending.current = null; setDraft(null); }
    function submit(event) {
        event.preventDefault();
        const value = parsePosition(target);
        if (!Number.isFinite(value) || value < 0 || value >= duration) {
            setError(`Indiquez une position avant ${seconds(duration)} (ex. 01:30 ou 90).`);
            return;
        }
        setError('');
        onSeek({ position: value });
    }
    return <div className="radio-seek" role="group" aria-label={`Déplacement — ${label}`}>
        <div className="radio-seek-progress">
            <span className="radio-seek-time">{seconds(draft ?? position)}</span>
            <input type="range" className="radio-slider" min={0} max={duration} step={0.1}
                value={Math.min(duration, draft ?? position)} disabled={disabled}
                aria-label={`Progression — ${label}`} aria-valuetext={`${seconds(draft ?? position)} sur ${seconds(duration)}`}
                onChange={event => { const value = Number(event.target.value); pending.current = value; setDraft(value); }}
                onPointerDown={event => event.currentTarget.setPointerCapture(event.pointerId)}
                onPointerUp={commitPosition} onPointerCancel={cancelPosition}
                onKeyUp={event => { if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) commitPosition(); }}
                onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); cancelPosition(); } }}
                onBlur={commitPosition}/>
            <span className="radio-seek-time">{seconds(duration)}</span>
        </div>
        <div className="transport">
            <button type="button" className="secondary" disabled={disabled} onClick={() => onSeek({ delta: -10 })} aria-label={`Reculer de 10 secondes — ${label}`}>−10 s</button>
            <button type="button" className="secondary" disabled={disabled} onClick={() => onSeek({ delta: 10 })} aria-label={`Avancer de 10 secondes — ${label}`}>+10 s</button>
        </div>
        <form onSubmit={submit} className="radio-seek-form">
            <label>Position précise<input aria-label={`Position précise — ${label}`} value={target} onChange={event => { setTarget(event.target.value); setError(''); }} placeholder="01:30 ou 90" disabled={disabled} /></label>
            <button className="secondary" type="submit" disabled={disabled || !target.trim()}>Aller</button>
        </form>
        {error && <p role="alert" className="help">{error}</p>}
    </div>;
}
