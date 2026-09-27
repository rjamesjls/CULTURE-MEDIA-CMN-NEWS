'use client';
import {uploadRadioFile} from '@/lib/afoluku-radio/upload';
import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Trash2, AudioLines, LoaderCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/afoluku-radio/ui';
import { NativeSelect, NativeSelectOption } from '@/components/afoluku-radio/ui';
import { contentKinds, musicGenres } from '@/lib/afoluku-radio/track-classification';
import { api, readFile } from '@/lib/afoluku-radio/audio';
import { analyzeWaveform, fileMime, isVideo } from '@/lib/afoluku-radio/track-media';
import { TrackArtwork, Waveform } from './track-visuals';
export default function TrackEditor(props){return <Editor key={props.track?.id||'none'} {...props}/>;}
function Editor({ track, onClose, onSaved }) {
    const [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
    const file = useRef(null);
    const [kind, setKind] = useState(track?.contentKind||'music'), [genre, setGenre] = useState(track?.musicGenre||'');
    async function work(action) { if (busy || !track)
        return; setBusy(true); setError(''); setMessage(''); try {
        await action();
        await onSaved();
    }
    catch (e) {
        setError(e.message);
    }
    finally {
        setBusy(false);
        if (file.current)
            file.current.value = '';
    } }
    async function image(chosen) {
        if (!track)
            return;
        const mime = fileMime(chosen), video = isVideo(mime);
        let duration = 0;
        if (chosen.size > (video ? 20 : 5) * 1024 * 1024)
            throw new Error(video ? 'Choisissez une vidéo de 20 Mo maximum.' : 'Choisissez une image de 5 Mo maximum.');
        if (video) {
            if (!['video/mp4', 'video/webm'].includes(mime))
                throw new Error('Utilisez une vidéo MP4 ou WebM.');
            duration = await readFile(chosen, true);
            if (duration > 120)
                throw new Error('La vidéo de pochette doit durer 2 minutes maximum.');
        }
        else {
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(chosen.type))
                throw new Error('Utilisez JPG, PNG, WebP, MP4 ou WebM.');
            const url = URL.createObjectURL(chosen);
            try {
                await new Promise((resolve, reject) => { const img = new Image(); img.onload = () => { if (img.naturalWidth > 8000 || img.naturalHeight > 8000)
                    reject(new Error('Image trop grande : 8 000 pixels maximum par côté.'));
                else
                    resolve(); }; img.onerror = () => reject(new Error('Cette image ne peut pas être ouverte.')); img.src = url; });
            }
            finally {
                URL.revokeObjectURL(url);
            }
        }
        await uploadRadioFile(chosen,{purpose:'cover',trackId:track.id,duration,mime});
        setMessage(video ? 'Pochette vidéo enregistrée. Elle tourne en boucle, sans son.' : 'Pochette enregistrée.');
    }
    async function analyze() { if (!track)
        return; const r = await fetch(`/api/afoluku-radio/audio/${track.id}`); if (!r.ok)
        throw new Error('Impossible de lire le fichier audio.'); const peaks = await analyzeWaveform(await r.blob(), track.duration); await api(`/api/afoluku-radio/tracks/${track.id}/waveform`, 'PUT', { peaks }); setMessage('Forme d’onde calculée et enregistrée.'); }
    return <Dialog open={!!track} onOpenChange={open => { if (!open && !busy) {
        setError('');
        setMessage('');
        onClose();
    } }}><DialogContent className="track-editor" onEscapeKeyDown={e => { if (busy)
        e.preventDefault(); }} onPointerDownOutside={e => { if (busy)
        e.preventDefault(); }}><DialogTitle>Modifier le titre</DialogTitle><DialogDescription>{track?.title}</DialogDescription><form className="classification-editor" onSubmit={e => { e.preventDefault(); void work(async () => { await api(`/api/afoluku-radio/tracks/${track.id}/classification`, 'PUT', { contentKind: kind, musicGenre: kind === 'music' ? genre || null : null }); setMessage('Type et catégorie enregistrés.'); }); }}><h3>Type et catégorie</h3><div className="classification-fields"><label>Type de contenu<NativeSelect aria-label="Type de contenu" disabled={busy} value={kind} onChange={e => { const value = e.target.value; setKind(value); if (value !== 'music')
        setGenre(''); }}>{contentKinds.map(([id, label]) => <NativeSelectOption key={id} value={id}>{label}</NativeSelectOption>)}</NativeSelect></label>{kind === 'music' && <label>Catégorie musicale<NativeSelect aria-label="Catégorie musicale" disabled={busy} value={genre} onChange={e => setGenre(e.target.value)}><NativeSelectOption value="">À classer</NativeSelectOption>{musicGenres.map(([id, label]) => <NativeSelectOption key={id} value={id}>{label}</NativeSelectOption>)}</NativeSelect></label>}</div><p className="help">{kind === 'music' ? 'Cette musique peut compter dans les streams et le classement.' : 'Ce contenu reste diffusable, mais ne compte pas dans les streams ni dans le classement.'}</p><button type="submit" className="primary" disabled={busy}>Enregistrer</button></form><div className="editor-art"><TrackArtwork src={track?.coverUrl} type={track?.coverType} animate title={track?.title} className="editor-cover"/><div><p>Une image ou une courte vidéo en boucle, sans son, dans la régie et chez les auditeurs.</p><input ref={file} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,.mp4,.webm" hidden onChange={e => { const chosen = e.target.files?.[0]; if (chosen)
        void work(() => image(chosen)); }}/><button className="primary" disabled={busy} onClick={() => file.current?.click()}><ImagePlus size={17}/>{track?.coverUrl ? 'Changer la pochette' : 'Ajouter une pochette'}</button>{track?.coverUrl && <button className="ghost" disabled={busy} onClick={() => void work(async () => { await api(`/api/afoluku-radio/tracks/${track.id}/cover`, 'DELETE'); setMessage('Pochette retirée.'); })}><Trash2 size={16}/>Retirer la pochette</button>}<small>Images : JPG, PNG, WebP · 5 Mo. Vidéos : MP4, WebM · 20 Mo et 2 min maximum.</small></div></div><div className="editor-wave"><div className="section-top"><h3>Forme d’onde</h3><AudioLines size={20}/></div><Waveform peaks={track?.peaks}/><p>Les variations d’amplitude du morceau au fil du temps. Le repère avance pendant la diffusion.</p><button className="secondary" disabled={busy || !!track && track.duration > 1200} onClick={() => void work(analyze)}>{busy ? <LoaderCircle size={17} className="spin"/> : <AudioLines size={17}/>} {track?.peaks?.length ? 'Recalculer' : 'Calculer la forme d’onde'}</button>{!!track && track.duration > 1200 && <p className="help">L’analyse est limitée aux audios de 20 minutes maximum. Le morceau reste diffusable.</p>}</div>{busy && <p className="help" role="status">Traitement en cours…</p>}{error && <p className="notice error" role="alert">{error}</p>}{message && <p className="notice" role="status">{message}</p>}</DialogContent></Dialog>;
}
