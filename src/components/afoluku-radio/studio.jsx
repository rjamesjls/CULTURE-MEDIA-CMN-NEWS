'use client';
import Link from 'next/link';
import { useLayoutEffect, useEffect, useRef, useState } from 'react';
import { Radio, Music2, ListMusic, Upload, Mic, MicOff, Headphones, ArrowUpRight, Plus, Play, Repeat2, Pause, SkipForward, Trash2, ArrowUp, ArrowDown, Pencil, Volume2, Square, RefreshCw, GripVertical, Trophy, Settings } from 'lucide-react';
import { Sidebar, SidebarProvider } from '@/components/afoluku-radio/ui';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/afoluku-radio/ui';
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/afoluku-radio/ui';
import { Slider } from '@/components/afoluku-radio/ui';
import { Switch } from '@/components/afoluku-radio/ui';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/afoluku-radio/ui';
import { Progress } from '@/components/afoluku-radio/ui';
import { NativeSelect, NativeSelectOption } from '@/components/afoluku-radio/ui';
import {uploadRadioFile} from '@/lib/afoluku-radio/upload';
import { api, AudioDesk, readFile } from '@/lib/afoluku-radio/audio';
import UrlImport from './url-import';
import SeekControls from './seek-controls';
import RadioRecorder from './recorder';
import { seekLocal } from '@/lib/afoluku-radio/seek';
import { Link2 } from 'lucide-react';
import TrackEditor from './track-editor';
import AudioSpectrum from './audio-spectrum';
import SettingsPanel, { useRadioSettings } from './radio-settings';
import AudienceCount from './audience-count';
import PushToTalk from './push-to-talk';
import StreamRanking from './stream-ranking';
import { TrackArtwork, Waveform } from './track-visuals';
import { classificationLabel, contentKinds, musicGenres } from '@/lib/afoluku-radio/track-classification';
import { analyzeWaveform, fileMime, isVideo } from '@/lib/afoluku-radio/track-media';
import BroadcastQueue, { TRACK_DRAG } from './broadcast-queue';
import { seconds, moveEntry } from '@/lib/afoluku-radio/radio';
const initial = { serverNow: Date.now(), active: false, paused: false, playlistName: '', loop: true, current: null, live: null, revision: 0, upcoming: [] };
export default function Studio() {
    const settings = useRadioSettings();
    const [urlImportOpen, setUrlImportOpen] = useState(false);
    const [needsLogin, setNeedsLogin] = useState(false);
    const studioReady = useRef(false);
    const [previewVolume, setPreviewVolume] = useState(70), [previewPaused, setPreviewPaused] = useState(false);
    const previewVideo = useRef(null), previewDesk = useRef(null);
    const settingsRef = useRef(settings);
    useLayoutEffect(()=>{settingsRef.current = settings;});
    const [view, setView] = useState('studio'), [tracks, setTracks] = useState([]), [playlists, setPlaylists] = useState([]), [station, setStation] = useState(initial), [selected, setSelected] = useState(''), [error, setError] = useState(''), [notice, setNotice] = useState(''), [loading, setLoading] = useState(true), [authorized, setAuthorized] = useState(false), [busy, setBusy] = useState(false), [upload, setUpload] = useState(null), [loop, setLoop] = useState(true), [monitor, setMonitor] = useState(false), [volume, setVolume] = useState(70), [micReady, setMicReady] = useState(false), [micLevel, setMicLevel] = useState(0), [session, setSession] = useState(null), [nameDialog, setNameDialog] = useState(null), [name, setName] = useState(''), [addDialog, setAddDialog] = useState(false), [confirm, setConfirm] = useState(null);
    const [kindFilter, setKindFilter] = useState('all'), [genreFilter, setGenreFilter] = useState('all');
    const [streamStats, setStreamStats] = useState(null), [streamsFailed, setStreamsFailed] = useState(false);
    const [previewEnabled, setPreviewEnabled] = useState(false), [talkStatus, setTalkStatus] = useState('idle');
    const holdSession = useRef(false);
    const previewEnabledRef = useRef(false);
    const [editingTrackId, setEditingTrackId] = useState(null), [previewTrack, setPreviewTrack] = useState(null);
    const programmeVideo = useRef(null);
    const input = useRef(null), desk = useRef(null), monitorRef = useRef(false), sessionRef = useRef(null), stationRef = useRef(station), pollBusy = useRef(false), playlistDrag = useRef(null), uploadLock = useRef(false);
    useLayoutEffect(()=>{stationRef.current=station;sessionRef.current=session;monitorRef.current=monitor;});
    const playlist = playlists.find(p => p.id === selected) || playlists[0];
    async function refresh() {
        let data;
        try {
            data = await api('/api/afoluku-radio/studio');
            setNeedsLogin(false);
        } catch (error) {
            setNeedsLogin(error.status === 401);
            throw error;
        }
        studioReady.current = true;
        setTracks(data.tracks);
        setPlaylists(data.playlists);
        setStation(data.station);
        setLoop(data.station.loop);
        setAuthorized(true);
        try {
            setStreamStats(await api('/api/afoluku-radio/streams'));
            setStreamsFailed(false);
        } catch {
            setStreamsFailed(true);
        }
        return data;
    }
    async function stopLive(message, keepMic = false) { const current = sessionRef.current; sessionRef.current = null; setSession(null); if (keepMic)
        desk.current?.stopLive();
    else {
        desk.current?.closeMic();
        setMicReady(false);
    } holdSession.current = false; setMicLevel(0); if (current) {
        try {
            await api('/api/afoluku-radio/live', 'POST', { action: 'stop', session: current });
        }
        catch (e) {
            setError(e.message);
        }
    } if (message)
        setError(message); await refresh(); }
    function ensure() { if (!desk.current) {
        const d = new AudioDesk(programmeVideo.current || undefined);
        d.monitor.gain.value = monitorRef.current ? volume / 100 : 0;
        d.setDuckLevel(settingsRef.current.duckVolume / 100);
        d.onLiveWarning = message => setError(message);
        d.onLiveRecovered = () => { setError(''); setNotice('Connexion du direct rétablie.'); };
        d.onError = message => { if (sessionRef.current)
            void stopLive(message);
        else
            setError(message); };
        desk.current = d;
    } void desk.current.resume().catch(e => setError(e.message)); return desk.current; }
    async function run(work) { if (busy)
        return; setBusy(true); setError(''); setNotice(''); try {
        await work();
    }
    catch (e) {
        setError(e.message);
    }
    finally {
        setBusy(false);
    } }
    useEffect(() => { let alive = true; void Promise.resolve().then(refresh).catch(e => { if (alive)
        setError(e.message); }).finally(() => { if (alive)
        setLoading(false); }); const timer = setInterval(async () => { if (!studioReady.current || pollBusy.current)
        return; pollBusy.current = true; try {
        const state = await api('/api/afoluku-radio/station');
        if (!alive || state.serverNow < stationRef.current.serverNow)
            return;
        setStation(state);
        if ((previewEnabledRef.current || sessionRef.current) && desk.current) {
            await desk.current.sync(state);
        }
    }
    catch (e) {
        if (alive)
            setError(e.message);
    }
    finally {
        pollBusy.current = false;
    } }, 2000); return () => { alive = false; clearInterval(timer); desk.current?.destroy(); desk.current = null; previewDesk.current?.destroy(); previewDesk.current = null; previewEnabledRef.current = false; if (sessionRef.current)
        void fetch('/api/afoluku-radio/live', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'stop', session: sessionRef.current }), keepalive: true }); }; }, []);
    useEffect(() => {
        if (!authorized)
            return;
        let alive = true;
        let timer;
        async function poll() { try {
            const result = await api('/api/afoluku-radio/streams');
            if (alive) {
                setStreamStats(result);
                setStreamsFailed(false);
            }
        }
        catch {
            if (alive)
                setStreamsFailed(true);
        }
        finally {
            if (alive)
                timer = setTimeout(poll, 10000);
        } }
        void poll();
        return () => { alive = false; clearTimeout(timer); };
    }, [authorized]);
    const streamCounts = new Map(streamStats?.tracks.map(t => [t.id, t.streams]));
    useEffect(() => { if (!micReady)
        return; const t = setInterval(() => setMicLevel(desk.current?.level() || 0), 100); return () => clearInterval(t); }, [micReady]);
    useEffect(() => { const model = document.modelContext; if (!model?.registerTool)
        return; const lifecycle = new AbortController(); const tools = [{ name: 'read_radio_studio', title: 'Consulter la régie radio', description: 'Lit la bibliothèque, les playlists et l’état de diffusion du compte autorisé.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: true }, async execute(input) { if (!input || typeof input !== 'object' || Object.keys(input).length)
                throw new Error('Aucun paramètre attendu.'); const d = await refresh(); return { tracks: d.tracks, playlists: d.playlists, station: d.station }; } }, { name: 'create_radio_playlist', title: 'Créer une playlist radio', description: 'Crée une playlist vide et l’affiche dans la régie. Ne lance pas de diffusion.', inputSchema: { type: 'object', properties: { name: { type: 'string', minLength: 1, maxLength: 80 } }, required: ['name'], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: true }, async execute(input) { const value = input; if (!value || typeof value.name !== 'string' || !value.name.trim() || value.name.length > 80 || Object.keys(value).some(k => k !== 'name'))
                throw new Error('Nom de playlist invalide.'); const result = await api('/api/afoluku-radio/playlists', 'POST', { name: value.name }); await refresh(); setSelected(result.id); setView('playlists'); return { id: result.id, name: value.name }; } }]; for (const tool of tools) {
        try {
            Promise.resolve(model.registerTool(tool, { signal: lifecycle.signal })).catch(() => { });
        }
        catch { }
    } return () => lifecycle.abort(); }, []);
    useEffect(() => { const warn = (e) => { if (sessionRef.current) {
        e.preventDefault();
        e.returnValue = '';
    } }; window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn); }, []);
    async function importFiles(files, {title: importTitle, throwOnFailure = false} = {}) { if (uploadLock.current)
        return []; uploadLock.current = true; const imported = []; setError(''); setNotice(''); const failures = []; let count = 0; for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUpload({ done: i, total: files.length, name: file.name });
        try {
            if (file.size > 50 * 1024 * 1024)
                throw new Error('50 Mo maximum');
            if (!file.size)
                throw new Error('fichier vide');
            const mime = fileMime(file);
            const duration = await readFile(file, isVideo(mime));
            if (duration >= 14400)
                throw new Error('4 heures maximum par fichier');
            const title = (importTitle || file.name.replace(/\.[^.]+$/, '')).slice(0, 180);
            const saved=await uploadRadioFile(file,{purpose:'track',title,duration,mime});
            imported.push(saved.id);
            count++;
            if (!isVideo(mime))
                try {
                    const peaks = await analyzeWaveform(file, duration);
                    await api(`/api/afoluku-radio/tracks/${saved.id}/waveform`, 'PUT', { peaks });
                }
                catch (e) {
                    failures.push(`${file.name} importé ; ${e.message}`);
                }
        }
        catch (e) {
            failures.push(`${file.name} : ${e.message}`);
        }
    } setUpload(null); try {
        await refresh();
    }
    catch (e) {
        failures.push(e.message);
    } if (count)
        setNotice(`${count} morceau${count > 1 ? 'x' : ''} importé${count > 1 ? 's' : ''}.`); if (failures.length)
        setError(failures.join(' · ')); if (input.current)
        input.current.value = ''; uploadLock.current = false; if (throwOnFailure && !count) throw new Error(failures.join(' · ') || 'Import impossible. Réessayez.'); return imported; }
    async function savePlaylist(p) { await api('/api/afoluku-radio/playlists', 'PUT', p); await refresh(); }
    async function launch() { if (!station.upcoming.length)
        throw new Error('Ajoutez des titres dans À venir avant de lancer la radio.'); ensure(); const current = await api('/api/afoluku-radio/station', 'POST', { action: 'queue-start', revision: station.revision, currentKey: station.current?.key || null, loop }); setStation(current); await activatePreview(current); await enableMonitor(); }
    async function mic() { const d = ensure(); await d.prepareMic(); setMicReady(true); setNotice('Microphone prêt. Maintenez « Maintenir pour parler » pour ouvrir le micro.'); }
    async function goLive(holding = false) { holdSession.current = holding; previewEnabledRef.current = true; setPreviewEnabled(true); const d = ensure(); await d.resume(); await d.sync(await api('/api/afoluku-radio/station')); const result = await api('/api/afoluku-radio/live', 'POST', { action: 'start' }); sessionRef.current = result.session; setSession(result.session); try {
        await d.startLive(result.session, !holding);
        setNotice('Connexion du direct… Les auditeurs entendront votre voix après quelques secondes.');
    }
    catch (e) {
        await stopLive();
        throw e;
    } }
    async function activatePreview(state) { const d = ensure(); await d.resume(); const current = state || await api('/api/afoluku-radio/station'); setStation(current); await d.sync(current); previewEnabledRef.current = true; setPreviewEnabled(true); }
    async function enableMonitor(value = volume) { const d = ensure(); await d.setMonitor(value / 100); monitorRef.current = true; setMonitor(true); setVolume(value); await activatePreview(); }
    async function toggleMonitor() { if (monitorRef.current) {
        await ensure().setMonitor(0);
        monitorRef.current = false;
        setMonitor(false);
    }
    else
        await enableMonitor(); }
    async function prepareRecording() {
        const current = await api('/api/afoluku-radio/station');
        if (current.live && current.live.session !== sessionRef.current)
            throw new Error('Lancez l’enregistrement depuis la régie qui diffuse le micro en direct.');
        await activatePreview(current);
        return ensure();
    }
    async function seekProgramme(request) {
        const before = stationRef.current;
        const current = await api('/api/afoluku-radio/station', 'POST', { action: 'seek', revision: before.revision, currentKey: before.current?.key, ...request });
        setStation(current); stationRef.current = current;
        if (desk.current) await desk.current.sync(current);
    }
    async function toggleProgramme() { const current = await api('/api/afoluku-radio/station', 'POST', { action: station.paused ? 'resume' : 'pause', revision: station.revision }); setStation(current); stationRef.current = current; await ensure().sync(current); previewEnabledRef.current = true; setPreviewEnabled(true); if (!current.paused && !monitorRef.current)
        await enableMonitor(); }
    async function remove() { if (!confirm)
        return; await api(confirm.type === 'track' ? '/api/afoluku-radio/tracks' : '/api/afoluku-radio/playlists', 'DELETE', { id: confirm.id }); setConfirm(null); await refresh(); }
    function ensureLocal() { if (!previewDesk.current) {
        const d = new AudioDesk(previewVideo.current || undefined);
        d.onPreviewEnd = () => { setPreviewTrack(null); setPreviewPaused(false); };
        d.onError = setError;
        previewDesk.current = d;
    } return previewDesk.current; }
    function stopPreview() { previewDesk.current?.stopPreview(); setPreviewTrack(null); setPreviewPaused(false); }
    async function preview(track) { const d = ensureLocal(); d.monitor.gain.value = previewVolume / 100; setPreviewTrack(track); setPreviewPaused(false); try {
        await d.preview(track.id, track.mime);
    }
    catch (e) {
        stopPreview();
        throw e;
    } setView('studio'); setNotice(`Préécoute locale : ${track.title}`); }
    async function toggleLocal() { const d = previewDesk.current; if (!d || !previewTrack)
        return; if (d.audio.paused) {
        await d.resume();
        await d.audio.play();
        setPreviewPaused(false);
    }
    else {
        d.audio.pause();
        setPreviewPaused(true);
    } }
    // Saved radio settings synchronise the local mixer controls with the external configuration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { setVolume(settings.monitorVolume); setPreviewVolume(settings.previewVolume); if (desk.current) {
        desk.current.monitor.gain.value = monitorRef.current ? settings.monitorVolume / 100 : 0;
        desk.current.setDuckLevel(settings.duckVolume / 100);
    } if (previewDesk.current)
        previewDesk.current.monitor.gain.value = settings.previewVolume / 100; }, [settings.monitorVolume, settings.previewVolume, settings.duckVolume]);
    const disabled = urlImportOpen || !authorized || busy || !!upload;
    async function enqueue(track) { const basis = stationRef.current; try {
        setStation(await api('/api/afoluku-radio/station', 'POST', { action: 'queue-update', revision: basis.revision, currentKey: basis.current?.key || null, trackIds: [...basis.upcoming.map(t => t.id), track.id] }));
        setNotice(`« ${track.title} » ajouté à À venir.`);
    }
    catch (e) {
        setStation(await api('/api/afoluku-radio/station'));
        throw e;
    } }
    function allowFileDrop(e) { if (!disabled && e.dataTransfer.types.includes('Files')) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    } }
    function uploadButton(label = 'Importer audio / vidéo', style = 'primary') { return <div className="radio-import-actions"><button className={style} disabled={disabled} onClick={() => input.current?.click()}><Upload size={18}/>{label}</button><button className="secondary" disabled={disabled} onClick={() => setUrlImportOpen(true)}><Link2 size={18}/>Importer depuis un lien</button></div>; }
    function trackRows(items, inPlaylist = false) { return <Table className="track-table"><TableHeader><TableRow><TableHead>TITRE</TableHead><TableHead className="duration-col">DURÉE</TableHead><TableHead className="text-right">STREAMS</TableHead><TableHead className="text-right">ACTIONS</TableHead></TableRow></TableHeader><TableBody>{items.map((t, i) => <TableRow key={`${t.id}-${i}`} draggable={!disabled} onDragStart={e => { if (disabled) {
        e.preventDefault();
        return;
    } if (inPlaylist) {
        playlistDrag.current = { index: i, playlist };
        e.dataTransfer.setData('application/x-afoluku-playlist', String(i));
        e.dataTransfer.effectAllowed = 'move';
    }
    else {
        e.dataTransfer.setData(TRACK_DRAG, t.id);
        e.dataTransfer.effectAllowed = 'copy';
    } }} onDragEnd={() => { playlistDrag.current = null; }} onDragOver={e => { if (inPlaylist && !disabled && e.dataTransfer.types.includes('application/x-afoluku-playlist')) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    } }} onDrop={e => { if (!inPlaylist || disabled || !e.dataTransfer.types.includes('application/x-afoluku-playlist'))
        return; e.preventDefault(); const origin = playlistDrag.current; if (!origin || origin.playlist.id !== playlist.id || origin.playlist.version !== playlist.version) {
        setError('La playlist a changé. Recommencez le déplacement.');
        return;
    } const bottom = e.clientY > e.currentTarget.getBoundingClientRect().top + e.currentTarget.getBoundingClientRect().height / 2; void run(() => savePlaylist({ ...playlist, trackIds: moveEntry(playlist.trackIds, origin.index, i + (bottom ? 1 : 0)) })); }}><TableCell><div className="row"><span className="drag-handle" aria-hidden="true"><GripVertical size={18}/></span><button className="artwork-button" disabled={disabled} title="Modifier le type, la catégorie et la pochette" aria-label={`Modifier ${t.title}`} onClick={() => setEditingTrackId(t.id)}><TrackArtwork src={t.coverUrl} type={t.coverType} title={t.title}/></button><div className="grow"><div className="track-title">{t.title}</div><span className={`content-tag ${t.contentKind !== 'music' ? 'excluded' : ''}`}>{classificationLabel(t)}</span><Waveform peaks={t.peaks} compact/><div className="subtle">{inPlaylist ? `Piste ${i + 1}` : `${(t.bytes / 1024 / 1024).toFixed(1)} Mo · ${`${isVideo(t.mime) ? 'VIDÉO' : 'AUDIO'} ${t.mime.split('/')[1].toUpperCase()}`}`}</div></div></div></TableCell><TableCell className="duration-col subtle">{seconds(t.duration)}</TableCell><TableCell className="text-right stream-number">{t.contentKind !== 'music' ? <span className="subtle">Hors classement</span> : streamStats && !streamsFailed ? (streamCounts.get(t.id) || 0).toLocaleString('fr-FR') : '—'}</TableCell><TableCell><div className="actions"><button className="ghost" title="Type, catégorie et pochette" aria-label={`Modifier ${t.title}`} disabled={disabled} onClick={() => setEditingTrackId(t.id)}><Pencil size={17}/><span>Modifier</span></button>{inPlaylist ? <><button className="ghost" title="Monter" aria-label={`Monter ${t.title}`} disabled={disabled || i === 0} onClick={() => void run(async () => { const ids = [...playlist.trackIds]; [ids[i - 1], ids[i]] = [ids[i], ids[i - 1]]; await savePlaylist({ ...playlist, trackIds: ids }); })}><ArrowUp size={17}/></button><button className="ghost" title="Descendre" aria-label={`Descendre ${t.title}`} disabled={disabled || i === items.length - 1} onClick={() => void run(async () => { const ids = [...playlist.trackIds]; [ids[i + 1], ids[i]] = [ids[i], ids[i + 1]]; await savePlaylist({ ...playlist, trackIds: ids }); })}><ArrowDown size={17}/></button><button className="ghost" title="Retirer de la playlist" aria-label={`Retirer ${t.title} de la playlist`} disabled={disabled} onClick={() => void run(() => savePlaylist({ ...playlist, trackIds: playlist.trackIds.filter((_, j) => j !== i) }))}><Trash2 size={17}/></button></> : <><button className="ghost" title="Ajouter à la file À venir" aria-label={`Ajouter ${t.title} à la file À venir`} disabled={disabled} onClick={() => void run(() => enqueue(t))}><Plus size={17}/></button><button className="ghost" title={previewTrack?.id === t.id ? 'Arrêter la préécoute' : 'Préécouter'} aria-label={`${previewTrack?.id === t.id ? 'Arrêter la préécoute de' : 'Préécouter'} ${t.title}`} disabled={disabled} onClick={() => previewTrack?.id === t.id ? stopPreview() : void run(() => preview(t))}>{previewTrack?.id === t.id ? <Square size={17}/> : <Play size={17}/>}</button><button className="ghost" title="Supprimer" aria-label={`Supprimer ${t.title}`} disabled={disabled} onClick={() => setConfirm({ type: 'track', id: t.id, name: t.title })}><Trash2 size={17}/></button></>}</div></TableCell></TableRow>)}</TableBody></Table>; }
    function library() { const filtered = tracks.filter(t => (kindFilter === 'all' || t.contentKind === kindFilter) && (genreFilter === 'all' || t.contentKind === 'music' && (genreFilter === 'unclassified' ? !t.musicGenre : t.musicGenre === genreFilter))); return <section className="library library-drop" aria-label="Bibliothèque musicale et importation" onDragOver={allowFileDrop} onDrop={e => { if (disabled || !e.dataTransfer.files.length)
        return; e.preventDefault(); void importFiles(Array.from(e.dataTransfer.files)); }}><div className="section-top"><div><h2>Votre bibliothèque</h2><p>Glissez un titre vers À venir, ou utilisez le bouton +. Cliquez sur Modifier pour choisir le type, la catégorie et la pochette.</p></div><span className="count">{tracks.length} titre{tracks.length !== 1 ? 's' : ''}</span></div>{previewTrack && <div className="notice preview-bar" role="status"><span><Headphones size={17}/> Préécoute : {previewTrack.title}</span><button className="secondary" onClick={stopPreview}><Square size={16}/>Arrêter la préécoute</button></div>}<div className="library-filters"><label>Contenus<NativeSelect aria-label="Filtrer les types de contenus" value={kindFilter} onChange={e => { setKindFilter(e.target.value); setGenreFilter('all'); }}><NativeSelectOption value="all">Tous les contenus</NativeSelectOption>{contentKinds.map(([id, label]) => <NativeSelectOption key={id} value={id}>{label}</NativeSelectOption>)}</NativeSelect></label>{(kindFilter === 'all' || kindFilter === 'music') && <label>Catégories musicales<NativeSelect aria-label="Filtrer les catégories musicales" value={genreFilter} onChange={e => setGenreFilter(e.target.value)}><NativeSelectOption value="all">Toutes les catégories</NativeSelectOption>{musicGenres.map(([id, label]) => <NativeSelectOption key={id} value={id}>{label}</NativeSelectOption>)}<NativeSelectOption value="unclassified">Musique à classer</NativeSelectOption></NativeSelect></label>}</div>{tracks.length ? (filtered.length ? trackRows(filtered) : <div className="empty"><p>Aucun titre ne correspond à ces filtres.</p><button className="secondary" onClick={() => { setKindFilter('all'); setGenreFilter('all'); }}>Afficher tous les contenus</button></div>) : <div className="empty"><div className="empty-icon"><Music2 /></div><h3>{loading ? 'Chargement de votre bibliothèque…' : 'Votre radio commence ici.'}</h3><p>Déposez vos fichiers audio ou vidéo ici pour les importer.</p>{uploadButton('Ajouter des fichiers', 'secondary')}<small>Audio ou vidéo MP4/WebM · 50 Mo maximum par fichier</small></div>}</section>; }
    if (!authorized) return <section className="workspace" aria-busy={loading || busy}>
        <h1>Régie AFOLUKU RADIO</h1>
        {loading || busy ? <p role="status">Vérification de la régie…</p> : <>
            <div className="notice error" role="alert">{error || 'La régie est temporairement indisponible.'}</div>
            {needsLogin ? <Link href="/admin/login?next=%2Fadmin%2Fwebradio" className="primary">Se connecter à la régie</Link> : <p>Les commandes seront disponibles dès que la connexion aux services de la radio sera rétablie.</p>}
            <button className="primary" onClick={() => void run(refresh)}><RefreshCw size={16}/>Vérifier à nouveau</button>
        </>}
    </section>;
    return <SidebarProvider className="studio"><Sidebar collapsible="none" className="rail"><Link href="/admin/webradio" className="brand">AFOLUKU<span>RADIO / STUDIO</span></Link><div className="rail-label">VOTRE ESPACE</div><nav aria-label="Navigation de la régie">{[['studio', Radio, 'Régie radio'], ['library', Music2, 'Bibliothèque'], ['playlists', ListMusic, 'Playlists'], ['ranking', Trophy, 'Classement'], ['settings', Settings, 'Paramètres']].map(([id, Icon, label]) => <button key={id} className={view === id ? 'selected' : ''} aria-current={view === id ? 'page' : undefined} title={label} onClick={() => setView(id)}><Icon />{label}</button>)}</nav><div className="rail-bottom"><div className="station-icon"><Radio /></div><b>AFOLUKU RADIO</b><span>La web radio d’AFOLUKU TV</span></div></Sidebar><div className="workspace"><header className="topbar"><AudienceCount enabled={authorized}/><Link href="/fr/radio" target="_blank" rel="noopener">Page d’écoute <ArrowUpRight size={16}/></Link></header><main><input ref={input} type="file" multiple accept="audio/*,video/mp4,video/webm,.mp3,.m4a,.wav,.ogg,.flac,.mp4,.webm" hidden onChange={e => { if (e.target.files)
        void importFiles(Array.from(e.target.files)); }}/><div className={`heading ${view === 'studio' ? 'studio-heading' : ''}`}><div><div className="eyebrow">AFOLUKU RADIO / {view === 'studio' ? 'RÉGIE' : view === 'library' ? 'BIBLIOTHÈQUE' : view === 'ranking' ? 'CLASSEMENT' : view === 'settings' ? 'PARAMÈTRES' : 'PLAYLISTS'}</div><h1>{view === 'studio' ? 'Régie radio' : view === 'library' ? 'Tous vos médias' : view === 'ranking' ? 'Classement des streams' : view === 'settings' ? 'Paramètres' : 'Votre programmation'}<span>.</span></h1><p>{view === 'settings' ? 'Personnalisez votre radio et votre confort d’écoute.' : view === 'ranking' ? 'Les titres les plus écoutés sur AFOLUKU RADIO.' : view === 'playlists' ? 'Composez l’ordre de passage de vos morceaux.' : 'Votre musique et votre voix, au même endroit.'}</p></div>{view === 'playlists' ? <button className="primary" disabled={disabled} onClick={() => { setName(''); setNameDialog('new'); }}><Plus size={18}/>Créer une playlist</button> : view === 'ranking' || view === 'settings' ? null : uploadButton()}</div>
 {error && <div className="notice error" role="alert">{error} <button className="ghost" aria-label="Réessayer le chargement" onClick={() => void run(refresh)}><RefreshCw size={16}/></button></div>}{needsLogin && <div className="notice"><Link href="/admin/login?next=%2Fadmin%2Fwebradio">Se reconnecter à la régie</Link></div>}{notice && <div className="notice" role="status">{notice}</div>}{upload && <div className="notice upload-progress"><div className="row"><Upload size={17}/><span>Importation {upload.done + 1}/{upload.total} : {upload.name}</span></div><Progress value={upload.done / upload.total * 100} className="mt-3"/></div>}
 <RadioRecorder prepare={prepareRecording} disabled={disabled}/>
 <div hidden={view !== 'studio'} className="studio-deck-area">
 <div className="studio-previews">
 <section className="media-deck preview-deck" aria-label="Préécoute locale"><header className="deck-heading"><span>PREVIEW</span><span className="badge">{previewTrack ? previewPaused ? 'EN PAUSE' : 'PRÉÉCOUTE' : 'PRÊT'}</span></header><div className="deck-stage"><video ref={previewVideo} hidden={!isVideo(previewTrack?.mime)} playsInline preload="metadata" aria-label="Vidéo en préécoute"/><div className="deck-audio" hidden={isVideo(previewTrack?.mime)}><TrackArtwork src={previewTrack?.coverUrl} type={previewTrack?.coverType} animate={!!previewTrack && !previewPaused} title={previewTrack?.title} className="onair-cover"/><AudioSpectrum hideTitle getAnalyser={() => previewDesk.current?.spectrum || null} active={!!previewTrack && !previewPaused} hint="Choisissez un titre à préécouter dans la bibliothèque."/></div></div><div className="deck-caption"><Headphones size={16}/><span>{previewTrack?.title || 'Aucun média en préécoute'}</span></div></section>
 <section className="media-deck programme-deck" aria-label="Programme à l’antenne"><header className="deck-heading"><span>{isVideo(station.current?.mime) && !station.live ? 'VIDÉO' : 'AUDIO'} À L’ANTENNE</span><span className={`badge ${station.active ? 'active' : ''}`}>{station.live ? 'DIRECT MICRO' : station.paused ? 'EN PAUSE' : station.current ? 'EN DIFFUSION' : 'HORS ANTENNE'}</span></header><div className="deck-stage"><video ref={programmeVideo} hidden={!(isVideo(station.current?.mime) && !station.live)} playsInline preload="metadata" aria-label="Vidéo à l’antenne"/><div className="deck-audio" hidden={isVideo(station.current?.mime) && !station.live}>{station.live ? <div className="cover onair-cover"><Mic size={42}/></div> : <TrackArtwork src={station.current?.coverUrl} type={station.current?.coverType} animate={previewEnabled && !station.paused} title={station.current?.title} className="onair-cover"/>}<AudioSpectrum hideTitle getAnalyser={() => desk.current?.spectrum || null} active={previewEnabled && station.active || !!session} hint="Activez le retour antenne pour voir le spectre."/></div></div><div className="deck-caption"><Radio size={16}/><span>{station.live ? 'Votre voix en direct' : station.current?.title || 'Aucun média à l’antenne'}</span></div></section>
 </div>
 <section className="studio-control-panel" aria-label="Panneau de contrôle"><div className="preview-panel"><h3><Headphones size={18}/>Préécoute</h3><p className="help">Écoute locale au casque.</p>{previewTrack && <SeekControls key={previewTrack.id} label="PREVIEW" duration={previewTrack.duration} readPosition={() => previewDesk.current?.audio.currentTime || 0} disabled={disabled} onSeek={request => void run(() => seekLocal(previewDesk.current?.audio, request))}/>}<div className="transport"><button className="secondary" disabled={disabled || !previewTrack} onClick={() => void run(toggleLocal)}>{previewPaused ? <Play size={17}/> : <Pause size={17}/>} {previewPaused ? 'Reprendre' : 'Pause'}</button><button className="secondary" disabled={!previewTrack} onClick={stopPreview}><Square size={16}/>Arrêter</button></div><div className="volume-control"><Volume2 size={18}/><Slider aria-label="Volume de préécoute" min={0} max={100} value={[previewVolume]} onValueChange={([v]) => { setPreviewVolume(v); if (previewDesk.current)
        previewDesk.current.monitor.gain.value = v / 100; }}/><span>{previewVolume}%</span></div></div><div className="onair-main"><h3><Radio size={18}/>Antenne</h3>{station.current && <SeekControls key={station.current.key} label="Antenne" duration={station.current.duration} readPosition={() => desk.current?.key === station.current?.key ? desk.current.audio.currentTime : station.current.offset} disabled={disabled || !!session || !!station.live || talkStatus !== 'idle'} onSeek={request => void run(() => seekProgramme(request))}/>}{station.current && <><Waveform peaks={station.current.peaks} progress={station.current.offset / station.current.duration} playback={station.current} readPosition={() => desk.current?.key === station.current?.key && !desk.current?.audio.paused ? desk.current.audio.currentTime : null} label={`Forme d’onde : ${station.current.title}`}/><div className="time-row"><span>{seconds(station.current.offset)}</span><span>{seconds(station.current.duration)}</span></div></>}<div className="row" style={{ margin: '18px 0' }}><NativeSelect aria-label="Playlist à charger dans À venir" value={playlist?.id || ''} onChange={e => setSelected(e.target.value)} disabled={disabled || !!session}><NativeSelectOption value="" disabled>Choisir une playlist</NativeSelectOption>{playlists.map(p => <NativeSelectOption value={p.id} key={p.id}>{p.name}</NativeSelectOption>)}</NativeSelect>{!playlists.length && <button className="ghost" aria-label="Créer une playlist" onClick={() => { setView('playlists'); setName(''); setNameDialog('new'); }} disabled={disabled}><Plus size={18}/></button>}</div><div className="transport">{(station.current || station.live) ? <>{station.current && <button className="primary" disabled={disabled} onClick={() => void run(toggleProgramme)}>{station.paused ? <Play size={17}/> : <Pause size={17}/>} {station.paused ? 'Reprendre la musique' : 'Pause musique'}</button>}<button className="secondary" disabled={disabled || talkStatus !== 'idle'} onClick={() => void run(async () => { if (session)
        await stopLive(); await api('/api/afoluku-radio/station', 'POST', { action: 'stop' }); desk.current?.audio.pause(); await refresh(); })}><Square size={16}/>Arrêter</button><button className="ghost" disabled={disabled || !!session || !!station.live} aria-label="Titre suivant" onClick={() => void run(async () => { setStation(await api('/api/afoluku-radio/station', 'POST', { action: 'next' })); })}><SkipForward size={21}/></button></> : <button className="primary" disabled={disabled || !station.upcoming.length} onClick={() => void run(launch)}><Play size={17}/>Diffuser la file</button>}<label className="loop-control"><Switch aria-label="Lecture en boucle" checked={loop} disabled={disabled} onCheckedChange={value => void run(async () => { const next = await api('/api/afoluku-radio/station', 'POST', { action: 'loop', loop: value }); setStation(next); setLoop(next.loop); })}/><Repeat2 size={16}/>En boucle</label></div><div className="preview-controls"><button className="secondary" disabled={disabled} onClick={() => void run(() => activatePreview())}><RefreshCw size={16}/>{previewEnabled ? 'Relancer le retour antenne' : 'Activer le retour antenne'}</button></div><div className="volume-control"><button className="secondary monitor-button" disabled={disabled} onClick={() => void run(toggleMonitor)} aria-pressed={monitor}>{monitor ? <Volume2 size={17}/> : <Headphones size={17}/>} {monitor ? 'Couper le retour son' : 'Activer le retour son'}</button><Slider aria-label="Volume d’écoute du studio" min={0} max={100} value={[volume]} onValueChange={([v]) => { setVolume(v); if (v === 0) {
        if (desk.current)
            desk.current.monitor.gain.value = 0;
        monitorRef.current = false;
        setMonitor(false);
    }
    else {
        const d = ensure();
        void d.setMonitor(v / 100).catch(e => setError(e.message));
        monitorRef.current = true;
        setMonitor(true);
        if (!previewEnabledRef.current)
            void activatePreview().catch(e => setError(e.message));
    } }}/><span>{volume}%</span></div></div><div className="live-panel"><div className="mic-icon"><Mic size={26}/></div><h3>{talkStatus === 'talking' ? 'Parlez, vous êtes en direct.' : session && !holdSession.current ? 'Vous avez l’antenne.' : 'Votre voix en direct.'}</h3><p>{micReady ? 'Maintenez le bouton pour parler. Relâchez : le micro se coupe et la musique remonte. Utilisez un casque.' : 'Préparez votre microphone, puis prenez l’antenne depuis votre navigateur.'}</p>{micReady && <div className="meter" aria-label={`Niveau du microphone : ${Math.round(micLevel)} %`}><i style={{ width: micLevel + '%' }}/></div>}<PushToTalk enabled={micReady && !disabled && (!session || holdSession.current)} start={() => goLive(true)} gate={active => desk.current?.setTalking(active)} stop={() => holdSession.current ? stopLive(undefined, true) : Promise.resolve()} onError={e => setError(e.message)} onStatus={setTalkStatus}/>{session && !holdSession.current ? <button className="danger" disabled={busy} onClick={() => void run(() => stopLive())}><MicOff size={17}/>Revenir à la musique</button> : micReady ? <button className="secondary" disabled={disabled || talkStatus !== 'idle'} onClick={() => void run(() => goLive())}><Mic size={17}/>Direct continu</button> : <button className="secondary" disabled={disabled || !!station.live} onClick={() => void run(mic)}><Mic size={17}/>Préparer le microphone</button>}{micReady && !session && talkStatus === 'idle' && <button className="ghost" onClick={() => { desk.current?.closeMic(); setMicReady(false); setMicLevel(0); }}>Fermer le microphone</button>}<small>{session && !station.live ? 'Connexion du direct en cours…' : 'Gardez cet onglet actif pendant le direct.'}</small></div></section></div>
 {view === 'studio' && <div className="scheduling-grid"><BroadcastQueue station={station} playlists={playlists} playlistId={playlist?.id} disabled={disabled} loop={loop} onState={setStation} onError={setError} onNotice={setNotice} onImport={importFiles}/>{library()}</div>}
 {view === 'settings' && <SettingsPanel enabled={authorized}/>}
 {view === 'ranking' && <StreamRanking tracks={tracks} stats={streamStats} failed={streamsFailed}/>}
 {view === 'library' && library()}
 {view === 'playlists' && (playlists.length ? <div className="playlist-layout"><div className="playlist-list">{playlists.map(p => <button className={`playlist-item ${p.id === playlist?.id ? 'active' : ''}`} key={p.id} onClick={() => setSelected(p.id)}>{p.name}<span>{p.trackIds.length} titre{p.trackIds.length !== 1 ? 's' : ''}</span></button>)}</div><section className="library"><div className="playlist-heading"><div><h2>{playlist.name}</h2><span className="subtle">{playlist.trackIds.length} titres · {seconds(playlist.trackIds.reduce((s, id) => s + (tracks.find(t => t.id === id)?.duration || 0), 0))}</span></div><div className="actions"><button className="ghost" aria-label="Renommer la playlist" disabled={disabled} onClick={() => { setName(playlist.name); setNameDialog('rename'); }}><Pencil size={16}/></button><button className="ghost" aria-label="Supprimer la playlist" disabled={disabled} onClick={() => setConfirm({ type: 'playlist', id: playlist.id, name: playlist.name })}><Trash2 size={16}/></button><button className="secondary" disabled={disabled || !tracks.length} onClick={() => setAddDialog(true)}><Plus size={16}/>Ajouter</button></div></div>{playlist.trackIds.length ? trackRows(playlist.trackIds.map(id => tracks.find(t => t.id === id)).filter(Boolean), true) : <div className="empty"><ListMusic size={30}/><h3 style={{ marginTop: 15 }}>Une playlist à composer.</h3><p>Ajoutez des morceaux de votre bibliothèque.</p><button className="secondary" disabled={disabled || !tracks.length} onClick={() => setAddDialog(true)}><Plus size={17}/>Choisir des morceaux</button></div>}</section></div> : <section className="library"><div className="empty"><div className="empty-icon"><ListMusic /></div><h3>Votre première programmation.</h3><p>Créez une playlist, ajoutez vos musiques, puis lancez la radio.</p><button className="primary" disabled={disabled} onClick={() => { setName(''); setNameDialog('new'); }}><Plus size={18}/>Créer une playlist</button></div></section>)}
 <footer><span>AFOLUKU TV · STUDIO RADIO</span><span><Headphones size={15}/>Une voix. Une culture. Une connexion.</span></footer></main></div>
 {urlImportOpen && <UrlImport onClose={() => setUrlImportOpen(false)} onImport={(file, title) => importFiles([file], {title, throwOnFailure: true})}/>}
 <TrackEditor track={tracks.find(t => t.id === editingTrackId) || null} onClose={() => setEditingTrackId(null)} onSaved={refresh}/>
 <Dialog open={!!nameDialog} onOpenChange={open => { if (!open)
        setNameDialog(null); }}><DialogContent><DialogTitle>{nameDialog === 'new' ? 'Créer une playlist' : 'Renommer la playlist'}</DialogTitle><DialogDescription>Choisissez un nom pour votre programmation.</DialogDescription><p className="help" role="alert">{error}</p><form onSubmit={e => { e.preventDefault(); void run(async () => { if (nameDialog === 'new') {
        const r = await api('/api/afoluku-radio/playlists', 'POST', { name });
        setSelected(r.id);
    }
    else
        await api('/api/afoluku-radio/playlists', 'PUT', { ...playlist, name }); await refresh(); setNameDialog(null); setView('playlists'); }); }}><label className="field-label" htmlFor="playlist-name">Nom de la playlist</label><input id="playlist-name" className="field" required maxLength={80} value={name} onChange={e => setName(e.target.value)} autoFocus/><button type="submit" className="primary mt-5" disabled={busy || !name.trim()}>Enregistrer</button></form></DialogContent></Dialog>
 <Dialog open={addDialog} onOpenChange={setAddDialog}><DialogContent className="max-h-[85vh] overflow-y-auto"><DialogTitle>Ajouter à {playlist?.name}</DialogTitle><DialogDescription>Les morceaux sont ajoutés à la fin de votre playlist.</DialogDescription><p className="help" role="alert">{error}</p>{tracks.map(t => <div className="picker" key={t.id}><div><div className="track-title">{t.title}</div><div className="subtle">{seconds(t.duration)}</div></div><button className="secondary" disabled={busy} onClick={() => void run(() => savePlaylist({ ...playlist, trackIds: [...playlist.trackIds, t.id] }))}><Plus size={16}/>Ajouter</button></div>)}</DialogContent></Dialog>
 <AlertDialog open={!!confirm} onOpenChange={open => { if (!open)
        setConfirm(null); }}><AlertDialogContent><AlertDialogTitle>Supprimer « {confirm?.name} » ?</AlertDialogTitle><AlertDialogDescription>{confirm?.type === 'track' ? 'Le fichier et ses compteurs de streams seront supprimés. Il sera aussi retiré des playlists.' : 'La playlist sera supprimée. Vos fichiers audio ou vidéo seront conservés.'}</AlertDialogDescription><p className="help" role="alert">{error}</p><AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction disabled={busy} onClick={e => { e.preventDefault(); void run(remove); }}>Supprimer</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
 </SidebarProvider>;
}
