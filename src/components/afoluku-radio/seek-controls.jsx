'use client';
import { useEffect, useState } from 'react';
import { seconds } from '@/lib/afoluku-radio/radio';
import { parsePosition } from '@/lib/afoluku-radio/seek';

export default function SeekControls({ label, duration, readPosition, disabled, onSeek }) {
    const [position, setPosition] = useState(0);
    const [target, setTarget] = useState('');
    const [error, setError] = useState('');
    useEffect(() => {
        const update = () => setPosition(Math.max(0, readPosition() || 0));
        const timer = setInterval(update, 250);
        return () => clearInterval(timer);
    }, [readPosition]);
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
        <div className="transport">
            <button type="button" className="secondary" disabled={disabled} onClick={() => onSeek({ delta: -10 })} aria-label={`Reculer de 10 secondes — ${label}`}>−10 s</button>
            <span className="radio-seek-time">{seconds(position)} / {seconds(duration)}</span>
            <button type="button" className="secondary" disabled={disabled} onClick={() => onSeek({ delta: 10 })} aria-label={`Avancer de 10 secondes — ${label}`}>+10 s</button>
        </div>
        <form onSubmit={submit} className="radio-seek-form">
            <label>Position précise<input aria-label={`Position précise — ${label}`} value={target} onChange={event => { setTarget(event.target.value); setError(''); }} placeholder="01:30 ou 90" disabled={disabled} /></label>
            <button className="secondary" type="submit" disabled={disabled || !target.trim()}>Aller</button>
        </form>
        {error && <p role="alert" className="help">{error}</p>}
    </div>;
}
