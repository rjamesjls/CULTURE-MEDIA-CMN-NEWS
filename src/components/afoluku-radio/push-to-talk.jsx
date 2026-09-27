'use client';
import { useLayoutEffect, useEffect, useRef, useState } from 'react';
import { Mic } from 'lucide-react';
import { HoldToTalk } from '@/lib/afoluku-radio/hold-to-talk';
export default function PushToTalk(props) {
    const actions = useRef(props);
    useLayoutEffect(() => { actions.current = props; });
    const controller = useRef(null);
    const [status, setStatus] = useState('idle');
    useEffect(() => {
        const talk = new HoldToTalk({ start: () => actions.current.start(), gate: value => actions.current.gate(value), stop: () => actions.current.stop(), error: error => actions.current.onError(error), change: value => { setStatus(value); actions.current.onStatus(value); } });
        controller.current = talk;
        const release = () => talk.release();
        const hidden = () => { if (document.hidden)
            release(); };
        window.addEventListener('blur', release);
        window.addEventListener('pagehide', release);
        document.addEventListener('visibilitychange', hidden);
        return () => { window.removeEventListener('blur', release); window.removeEventListener('pagehide', release); document.removeEventListener('visibilitychange', hidden); talk.dispose(); controller.current = null; };
    }, []);
    useEffect(() => { if (!props.enabled)
        controller.current?.release(); }, [props.enabled]);
    const release = () => controller.current?.release();
    return <div className="talk-control"><button type="button" className={`push-to-talk ${status === 'talking' ? 'talking' : ''}`} disabled={!props.enabled} aria-pressed={status === 'talking'} onPointerDown={e => { if (!e.isPrimary || e.button !== 0)
        return; e.preventDefault(); e.currentTarget.focus(); e.currentTarget.setPointerCapture(e.pointerId); controller.current?.press(); }} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release} onBlur={release} onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (!e.repeat)
            controller.current?.press();
    } }} onKeyUp={e => { if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        release();
    } }} onContextMenu={e => e.preventDefault()}><Mic size={22}/>{status === 'talking' ? 'Parlez · relâchez pour couper' : status === 'starting' ? 'Connexion… maintenez appuyé' : 'Maintenir pour parler'}</button>
  <span className="help" role="status">{status === 'talking' ? 'Micro ouvert · musique baissée' : status === 'draining' || status === 'stopping' ? 'Micro coupé · fin de transmission…' : props.enabled ? 'Maintenez avec la souris, le doigt ou la touche Espace.' : 'Préparez le microphone pour utiliser ce bouton.'}</span>
 </div>;
}
