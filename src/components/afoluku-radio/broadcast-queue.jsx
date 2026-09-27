'use client';
import { useRef, useState } from 'react';
import { GripVertical, ArrowUp, ArrowDown, Trash2, Plus, Upload, ListMusic, Play } from 'lucide-react';
import { api } from '@/lib/afoluku-radio/audio';
import { TrackArtwork } from './track-visuals';
import { moveEntry, seconds } from '@/lib/afoluku-radio/radio';
export const TRACK_DRAG = 'application/x-afoluku-track';
const QUEUE_DRAG = 'application/x-afoluku-queue';
export default function BroadcastQueue({ station, playlists, playlistId, disabled, loop, onState, onError, onNotice, onImport }) {
    const [saving, setSaving] = useState(false), [over, setOver] = useState(null);
    const lock = useRef(false), input = useRef(null), drag = useRef(null);
    const queue = station.upcoming || [];
    const locked = disabled || saving;
    async function change(action, extra, basis = station, clearError = true) { if (lock.current || disabled)
        return; lock.current = true; setSaving(true); if (clearError)
        onError(''); try {
        const result = await api('/api/afoluku-radio/station', 'POST', { action, revision: basis.revision, currentKey: basis.current?.key || null, ...extra });
        onState(result);
        onNotice(action === 'queue-load' ? 'La playlist remplace les titres à venir.' : action === 'queue-start' ? 'La file est à l’antenne.' : 'Ordre de passage enregistré.');
    }
    catch (e) {
        onError(e.message);
        try {
            onState(await api('/api/afoluku-radio/station'));
        }
        catch { }
    }
    finally {
        lock.current = false;
        setSaving(false);
        setOver(null);
        drag.current = null;
    } }
    async function update(next, basis = station) { await change('queue-update', { trackIds: next.map(t => t.id) }, basis); }
    function accepts(e) { return !locked && Array.from(e.dataTransfer.types).some(t => [QUEUE_DRAG, TRACK_DRAG, 'Files'].includes(t)); }
    function dragOver(e, index) { if (!accepts(e))
        return; e.preventDefault(); e.stopPropagation(); setOver(index); e.dataTransfer.dropEffect = e.dataTransfer.types.includes(QUEUE_DRAG) ? 'move' : 'copy'; }
    async function importToQueue(files, index) { const basis = station; if (locked)
        return; setSaving(true); onError(''); try {
        const ids = await onImport(files);
        if (ids.length) {
            const fresh = await api('/api/afoluku-radio/station');
            onState(fresh);
            const next = fresh.upcoming.map(t => t.id);
            const unchanged = fresh.revision === basis.revision && fresh.current?.key === basis.current?.key;
            next.splice(unchanged && index !== undefined ? Math.min(index, next.length) : next.length, 0, ...ids);
            await change('queue-update', { trackIds: next }, fresh, false);
        }
    }
    catch (e) {
        onError(e.message);
    }
    finally {
        setSaving(false);
        if (input.current)
            input.current.value = '';
    } }
    async function drop(e, index) {
        if (!accepts(e))
            return;
        e.preventDefault();
        e.stopPropagation();
        setOver(null);
        if (e.dataTransfer.files.length) {
            await importToQueue(Array.from(e.dataTransfer.files), index);
            return;
        }
        if (e.dataTransfer.types.includes(QUEUE_DRAG)) {
            const origin = drag.current;
            if (!origin)
                return;
            if (station.revision !== origin.state.revision || station.current?.key !== origin.state.current?.key) {
                onError('Le titre à l’antenne ou la file a changé pendant le déplacement. Recommencez.');
                drag.current = null;
                return;
            }
            await update(moveEntry(origin.state.upcoming, origin.index, index), origin.state);
            return;
        }
        const id = e.dataTransfer.getData(TRACK_DRAG);
        if (!id)
            return;
        const ids = queue.map(t => t.id);
        ids.splice(index, 0, id);
        await change('queue-update', { trackIds: ids });
    }
    let delay = station.current ? station.current.duration - station.current.offset : 0;
    return <section className="broadcast-queue" aria-label="Titres à venir" onDragOver={e => dragOver(e, queue.length)} onDrop={e => void drop(e, queue.length)} onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget))
        setOver(null); }}>
 <div className="queue-heading"><div><div className="eyebrow">ORDRE DE PASSAGE</div><h2>À venir <span className="count">{queue.length}</span></h2><p>Glissez vos morceaux ici, puis organisez leur passage.</p></div><div className="queue-tools"><button className="secondary" disabled={locked || !playlistId || !playlists.find(p => p.id === playlistId)?.trackIds.length} title="Remplacer À venir par les titres de cette playlist" onClick={() => void change('queue-load', { playlistId })}><ListMusic size={17}/>Charger la playlist</button><button className="secondary" disabled={locked} onClick={() => input.current?.click()}><Upload size={17}/>Importer ici</button></div></div>
 <input ref={input} type="file" hidden multiple accept="audio/*,video/mp4,video/webm,.mp3,.m4a,.wav,.ogg,.flac,.mp4,.webm" onChange={e => { if (e.target.files)
        void importToQueue(Array.from(e.target.files)); }}/>
 <div className={`queue-dropzone ${over !== null ? 'drop-active' : ''}`}>
 {queue.map((track, index) => { const startsIn = delay + queue.slice(0,index).reduce((sum,item)=>sum+item.duration,0); return <div className={`queue-entry ${over === index ? 'drop-before' : ''}`} key={`${index}-${track.id}`} draggable={!locked} onDragStart={e => { if (locked) {
        e.preventDefault();
        return;
    } drag.current = { index, state: station }; e.dataTransfer.setData(QUEUE_DRAG, String(index)); e.dataTransfer.effectAllowed = 'move'; }} onDragEnd={() => { drag.current = null; setOver(null); }} onDragOver={e => { const r = e.currentTarget.getBoundingClientRect(); dragOver(e, index + (e.clientY > r.top + r.height / 2 ? 1 : 0)); }} onDrop={e => { const r = e.currentTarget.getBoundingClientRect(); void drop(e, index + (e.clientY > r.top + r.height / 2 ? 1 : 0)); }}><span className="drag-handle" aria-hidden="true"><GripVertical size={19}/></span><span className="queue-number">{String(index + 1).padStart(2, '0')}</span><TrackArtwork src={track.coverUrl} type={track.coverType} title={track.title} className="queue-cover"/><div className="grow"><div className="track-title">{track.title}</div><div className="subtle">{station.current ? `Dans ${seconds(startsIn)} · ` : index === 0 ? 'Premier à passer · ' : ''}{seconds(track.duration)}{track.mime?.startsWith('video/') ? ' · Vidéo' : ''}</div></div>{index === 0 && <span className="next-badge">SUIVANT</span>}<div className="actions"><button className="ghost" aria-label={`Monter ${track.title} dans la file`} disabled={locked || index === 0} onClick={() => void update(moveEntry(queue, index, index - 1))}><ArrowUp size={16}/></button><button className="ghost" aria-label={`Descendre ${track.title} dans la file`} disabled={locked || index === queue.length - 1} onClick={() => void update(moveEntry(queue, index, index + 2))}><ArrowDown size={16}/></button><button className="ghost" aria-label={`Retirer ${track.title} de la file`} disabled={locked} onClick={() => void update(queue.filter((_, i) => i !== index))}><Trash2 size={16}/></button></div></div>; })}
 <div className={`queue-tail ${over === queue.length ? 'drop-before' : ''}`} onDragOver={e => dragOver(e, queue.length)} onDrop={e => void drop(e, queue.length)}><Plus size={21}/><span>{queue.length ? 'Déposer à la fin de la file' : 'Déposez vos fichiers audio ou vidéo ou des titres de la bibliothèque'}</span></div>
 </div><div className="queue-footer"><span>{saving ? 'Enregistrement…' : station.current ? station.loop ? 'La boucle reprend ensuite avec le titre actuel.' : 'Les changements s’appliquent après le titre en cours.' : 'La file est enregistrée. Lancez-la quand vous êtes prêt.'}</span>{!station.current && <button className="primary" disabled={locked || !queue.length || !!station.live} onClick={() => void change('queue-start', { loop })}><Play size={17}/>Diffuser la file</button>}</div>
 </section>;
}
