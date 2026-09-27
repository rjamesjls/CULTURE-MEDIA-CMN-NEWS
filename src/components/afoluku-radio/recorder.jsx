'use client';
import { useEffect, useRef, useState } from 'react';
import { Circle, Square, Download } from 'lucide-react';
import { recordMix } from '@/lib/afoluku-radio/recording';
import { seconds } from '@/lib/afoluku-radio/radio';

export default function RadioRecorder({ prepare, disabled, before, after, onExport }) {
    const recorder = useRef(null), starting = useRef(false), mounted = useRef(false), urls = useRef([]);
    const [status, setStatus] = useState('idle'), [elapsed, setElapsed] = useState(0);
    const [takes, setTakes] = useState([]), [error, setError] = useState('');
    useEffect(() => {
        mounted.current = true;
        const allocatedUrls = urls.current;
        return () => { mounted.current = false; recorder.current?.stop(); allocatedUrls.forEach(URL.revokeObjectURL); };
    }, []);
    useEffect(() => {
        if (status !== 'recording') return;
        const start = Date.now();
        const timer = setInterval(() => setElapsed((Date.now() - start) / 1000), 500);
        return () => clearInterval(timer);
    }, [status]);
    useEffect(() => {
        if (status === 'idle' && !takes.some(t => !t.saved)) return;
        const warn = event => { event.preventDefault(); event.returnValue = ''; };
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [status, takes]);
    async function start() {
        if (recorder.current || starting.current) return;
        starting.current = true; setStatus('starting'); setError(''); setElapsed(0);
        try {
            const desk = await prepare();
            if (!mounted.current) return;
            const startedAt = Date.now();
            const name = `AFOLUKU-RADIO-${new Date().toISOString().replace(/[:.]/g, '-')}`;
            recorder.current = recordMix(desk, {
                error: message => mounted.current && setError(message),
                limit: message => mounted.current && setError(message),
                complete: (blob, extension) => {
                    recorder.current = null;
                    if (!mounted.current) return;
                    setStatus('idle');
                    if (!blob.size) { setError('Aucun son enregistré. Relancez une prise.'); return; }
                    const url = URL.createObjectURL(blob); urls.current.push(url);
                    setTakes(old => [{ url, name: `${name}.${extension}`, bytes: blob.size, title: `Émission du ${new Date(startedAt).toLocaleString('fr-FR')}`, duration: (Date.now() - startedAt) / 1000, saved: false }, ...old]);
                },
            });
            setStatus('recording');
        } catch (e) { if (mounted.current) { setError(e.message); setStatus('idle'); } }
        finally { starting.current = false; }
    }
    return <section className="radio-recorder" aria-label="Enregistrement de la radio">
        <div className="radio-import-actions">
            {before}
            {status === 'recording' ? <button className="primary record-active" onClick={() => { setStatus('stopping'); recorder.current?.stop(); }}><Square size={17}/>Arrêter l’enregistrement</button> : <button className="primary" title="Enregistrer le son de l’antenne" disabled={disabled || status !== 'idle'} onClick={() => void start()}><Circle size={18}/>{status === 'starting' ? 'Préparation…' : status === 'stopping' ? 'Finalisation…' : 'Enregistrer la radio'}</button>}
            {after}
            {status !== 'idle' && <span className="record-timer" role="status">● REC {seconds(elapsed)}</span>}
        </div>
        {error && <p className="notice error" role="alert">{error}</p>}
        {(status !== 'idle' || takes.length > 0 || error) && <details className="record-details">
        <summary>{takes.length ? `Mes enregistrements (${takes.length})` : 'Enregistrement en cours'}</summary>
        <p className="help">Enregistre le son de l’antenne : musique, jingles et micro de cette régie. Gardez cette page ouverte jusqu’au téléchargement. Audio uniquement.</p>
        {takes.map(take => <div className="record-take" key={take.url}><audio controls src={take.url} preload="metadata" aria-label={`Réécouter ${take.name}`}/><a className="secondary" href={take.url} download={take.name} onClick={() => setTakes(old => old.map(t => t.url === take.url ? { ...t, saved: true } : t))}><Download size={16}/>Télécharger · {(take.bytes / 1024 / 1024).toFixed(1)} Mo</a><button className="secondary" onClick={() => onExport?.({url:take.url,title:take.title || take.name,duration:take.duration,subtitle:'Extrait d’émission'})}>Exporter un extrait 3:4</button><span className="help">{take.name}</span></div>)}
        </details>}
    </section>;
}
