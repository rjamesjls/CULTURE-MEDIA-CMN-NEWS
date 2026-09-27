'use client';
import {useEffect, useRef, useState} from 'react';
import {Link2, LoaderCircle} from 'lucide-react';
import {Dialog, DialogContent, DialogTitle, DialogDescription} from './ui';
import {downloadMediaUrl} from '@/lib/afoluku-radio/url-import';

export default function UrlImport({onClose, onImport}) {
    const [url, setUrl] = useState(''), [title, setTitle] = useState('');
    const [phase, setPhase] = useState('idle'), [bytes, setBytes] = useState(0), [error, setError] = useState('');
    const operation = useRef(null);
    useEffect(() => () => operation.current?.abort(), []);
    function close() {
        if (phase === 'importing') return;
        operation.current?.abort();
        onClose();
    }
    async function submit(event) {
        event.preventDefault();
        if (operation.current) return;
        const controller = new AbortController();
        operation.current = controller;
        setPhase('downloading'); setError(''); setBytes(0);
        try {
            const file = await downloadMediaUrl(url, {signal: controller.signal, onProgress: setBytes});
            if (controller.signal.aborted) return;
            setPhase('importing');
            await onImport(file, title.trim());
            onClose();
        } catch (error) {
            if (!controller.signal.aborted) setError(error.message);
        } finally {
            operation.current = null;
            setPhase('idle');
        }
    }
    const busy = phase !== 'idle';
    return <Dialog open onOpenChange={open => { if (!open) close(); }}>
        <DialogContent closeDisabled={phase === 'importing'}>
            <DialogTitle>Importer depuis un lien</DialogTitle>
            <DialogDescription>Ajoutez un fichier audio ou vidéo à votre bibliothèque, puis organisez son passage dans vos playlists.</DialogDescription>
            <form onSubmit={submit} aria-busy={busy}>
                <label className="field-label" htmlFor="radio-import-url">Lien direct du fichier</label>
                <input id="radio-import-url" className="field" type="url" placeholder="https://exemple.com/musique.mp3" required autoFocus value={url} onChange={e => setUrl(e.target.value)} disabled={busy} autoComplete="off" spellCheck={false}/>
                <label className="field-label" htmlFor="radio-import-title">Titre (facultatif)</label>
                <input id="radio-import-title" className="field" maxLength={180} value={title} onChange={e => setTitle(e.target.value)} disabled={busy} placeholder="Le nom du fichier sera utilisé par défaut"/>
                <p className="help">Lien HTTPS vers un fichier accessible publiquement · 50 Mo maximum. Les pages YouTube et les liens de pages de partage ne sont pas pris en charge. Certains hébergeurs bloquent l’import par lien.</p>
                {error && <p className="notice error" role="alert">{error}</p>}
                {busy && <p role="status">{phase === 'downloading' ? `Téléchargement… ${(bytes / 1024 / 1024).toFixed(1)} Mo reçus` : 'Ajout à la bibliothèque et analyse du fichier…'}</p>}
                <div className="radio-modal-actions">
                    <button type="button" className="secondary" disabled={phase === 'importing'} onClick={close}>Annuler</button>
                    <button type="submit" className="primary" disabled={busy || !url.trim()}>{busy ? <LoaderCircle size={18} className="spin"/> : <Link2 size={18}/>}Importer</button>
                </div>
            </form>
        </DialogContent>
    </Dialog>;
}
