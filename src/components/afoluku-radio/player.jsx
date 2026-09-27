'use client';
import Link from 'next/link';
import PortraitVisual from './portrait-visual';
import { useLayoutEffect, useState, useEffect, useRef } from 'react';
import { Play, Pause, Mic, Volume2 } from 'lucide-react';
import { Slider } from '@/components/afoluku-radio/ui';
import { TrackArtwork, Waveform } from './track-visuals';
import { useRadioSettings, RadioLogo } from './radio-settings';
import AudioSpectrum from './audio-spectrum';
import { api, ListenerAudio } from '@/lib/afoluku-radio/audio';
import { ListenerPresence, listenerId } from '@/lib/afoluku-radio/listener-presence';
import { StreamReporter } from '@/lib/afoluku-radio/stream-reporter';
import { broadcastArtwork } from '@/lib/afoluku-radio/radio-settings';
import { isVideo } from '@/lib/afoluku-radio/track-media';
export default function Listener({compact=false,href="/fr/radio"}) {
    const settings = useRadioSettings();
    const [station, setStation] = useState(null), [playing, setPlaying] = useState(false), [error, setError] = useState(''), [volume, setVolume] = useState(80);
    const video = useRef(null), cameraVideo = useRef(null);
    const player = useRef(null), enabled = useRef(false), polling = useRef(false), operation = useRef(0);
    const presence = useRef(null);
    const streams = useRef(null), stationRef = useRef(station);
    useLayoutEffect(() => { stationRef.current = station; });
    useEffect(() => {
        const reporter = new StreamReporter(listenerId());
        streams.current = reporter;
        const sample = () => {
            const current = stationRef.current?.current, p = player.current;
            const track = enabled.current && p?.isPlaying() && p.gain.gain.value > 0 && !p.session && current?.contentKind === 'music' && current.streamKey && p.key === current.key && !stationRef.current?.live && !stationRef.current?.camera && !stationRef.current?.paused ? { id: current.streamTrackId || current.id, key: current.streamKey } : null;
            void reporter.report(track);
        };
        const leave = () => void reporter.report(null, Date.now(), true);
        const timer = setInterval(sample, 1000);
        window.addEventListener('pagehide', leave);
        return () => { clearInterval(timer); window.removeEventListener('pagehide', leave); leave(); streams.current = null; };
    }, []);
    useEffect(() => {
        const reporter = new ListenerPresence(listenerId());
        presence.current = reporter;
        const sample = () => void reporter.report(enabled.current && !!player.current?.isPlaying());
        const leave = () => void reporter.report(false, Date.now(), true);
        const timer = setInterval(sample, 2000);
        window.addEventListener('pagehide', leave);
        window.addEventListener('pageshow', sample);
        return () => { clearInterval(timer); window.removeEventListener('pagehide', leave); window.removeEventListener('pageshow', sample); leave(); presence.current = null; };
    }, []);
    useEffect(() => {
        let alive = true;
        let timer;
        async function poll() {
            let interval = 1800;
            if (polling.current) {
                timer = setTimeout(poll, 500);
                return;
            }
            polling.current = true;
            const started = performance.now();
            try {
                const state = await api('/api/afoluku-radio/station');
                if (!alive)
                    return;
                setStation(state);
                interval = state.live || enabled.current ? 500 : 1800;
                if (enabled.current && player.current) {
                    const ticket = operation.current;
                    await player.current.sync(state);
                    if (alive && ticket === operation.current)
                        setError('');
                }
            }
            catch (e) {
                if (alive && enabled.current)
                    setError(e.message);
            }
            finally {
                polling.current = false;
                if (alive)
                    timer = setTimeout(poll, Math.max(50, interval - (performance.now() - started)));
            }
        }
        void poll();
        return () => { alive = false; clearTimeout(timer); enabled.current = false; operation.current++; player.current?.destroy(); player.current = null; };
    }, []);
    async function toggle() {
        const ticket = ++operation.current;
        setError('');
        if (enabled.current) {
            enabled.current = false;
            setPlaying(false);
            player.current?.stop();
            void presence.current?.report(false);
            void streams.current?.report(null);
            return;
        }
        enabled.current = true;
        setPlaying(true);
        try {
            if (!player.current) {
                player.current = new ListenerAudio(video.current || undefined, cameraVideo.current || undefined);
                player.current.onError = setError;
            }
            const current = player.current;
            current.gain.gain.value = volume / 100;
            await current.resume();
            if (ticket !== operation.current)
                return;
            const state = await api('/api/afoluku-radio/station');
            if (ticket !== operation.current)
                return;
            setStation(state);
            await current.sync(state);
            if (ticket === operation.current)
                void presence.current?.report(current.isPlaying());
        }
        catch (e) {
            if (ticket !== operation.current)
                return;
            enabled.current = false;
            setPlaying(false);
            player.current?.stop();
            setError(e.message);
        }
    }
    const showCamera = !!station?.camera && settings.videoEnabled !== false;
    const showVideo = !station?.camera && settings.videoEnabled !== false && isVideo(station?.current?.mime) && !station?.live;
    if(compact)return <aside className="radio-mini" aria-label="Lecteur AFOLUKU RADIO"><video ref={video} hidden playsInline preload="metadata"/><video ref={cameraVideo} hidden muted playsInline/><div className="radio-mini-info"><Link href={href}><b>{settings.name}</b> ↗</Link><span>{station?.live||station?.camera?'En direct':station?.current?.title||'Hors antenne'}</span></div><button className="primary" disabled={!station?.active&&!playing} onClick={()=>void toggle()} aria-label={playing?'Mettre la radio en pause':'Écouter la radio'}>{playing?<Pause size={20}/>:<Play size={20}/>}</button><input type="range" min="0" max="100" aria-label="Volume de la radio" value={volume} onChange={e=>{const v=Number(e.target.value);setVolume(v);if(player.current)player.current.gain.gain.value=v/100;}}/>{error&&<span className="radio-mini-error" role="alert">{error}</span>}</aside>;
    return <main className={`listener ${settings.publicPortrait ? 'listener-portrait' : ''}`}><Link href="/fr/radio" className="listener-brand" aria-label={settings.name}><RadioLogo src={settings.logoUrl} name={settings.name}/><span>RADIO / LE DIRECT</span></Link><div className="listener-card">{settings.publicPortrait && <PortraitVisual settings={settings} station={station} getAnalyser={() => playing ? player.current?.spectrum : null} readPosition={() => playing && player.current?.key === station?.current?.key ? player.current.audio.currentTime : station?.current?.offset} readVideo={() => showCamera ? cameraVideo.current : showVideo ? video.current : null}/>}<div className="listener-information" hidden={settings.publicPortrait}><div className="section-top"><span className="eyebrow">LA WEB RADIO D’AFOLUKU TV</span><span className={`badge ${station?.active ? 'active' : ''}`}>{station?.live||station?.camera ? 'EN DIRECT' : station?.paused ? 'MUSIQUE EN PAUSE' : station?.active ? 'À L’ANTENNE' : 'HORS ANTENNE'}</span></div><h1>{settings.name === 'AFOLUKU RADIO' ? <>AFOLUKU <span>RADIO</span></> : settings.name}</h1><div className="programme-screen listener-camera" hidden={!showCamera}><video ref={cameraVideo} muted playsInline aria-label="Caméra en direct"/>{!playing && <p className="help">Appuyez sur lecture pour regarder la caméra.</p>}</div><div className="programme-screen listener-video" hidden={!showVideo}><video ref={video} playsInline preload="metadata" poster={station?.current?.coverType !== 'video' ? station?.current?.coverUrl || undefined : undefined} aria-label={station?.current?.title ? `Vidéo : ${station.current.title}` : 'Vidéo du programme'}/>{!playing && <p className="help">Appuyez sur « Regarder le direct » pour démarrer la vidéo.</p>}</div><div className="listener-art" hidden={showVideo || showCamera}>{station?.live ? <div className="cover"><Mic size={74}/></div> : <TrackArtwork {...broadcastArtwork(station?.current, settings)} animate={playing} title={station?.current?.title} className="listener-cover"/>}</div><h2 className="track-title">{station?.live||station?.camera ? 'Votre rendez-vous en direct' : station?.current?.title || 'La radio prépare son prochain rendez-vous.'}</h2><p>{station?.paused && !station.live && !station.camera ? 'La musique est en pause. La lecture reprendra avec la régie.' : station?.active ? settings.name + ' · ' + (station.playlistName || 'Le direct') : 'Revenez ici lorsque la programmation sera lancée.'}</p>{station?.current && !station.live && !station.camera && <Waveform progressFallback peaks={station.current.peaks} progress={station.current.offset / station.current.duration} playback={{...station.current, paused: station.paused}} readPosition={() => enabled.current && player.current?.key === station.current?.key && !player.current?.audio.paused ? player.current.audio.currentTime : null} label={`Forme d’onde : ${station.current.title}`}/>}<AudioSpectrum hideTitle allowModelSelection={false} showFrequencyLabels={false} getAnalyser={() => player.current?.spectrum || null} active={playing && !!station?.active} hint="Lancez l’écoute pour voir le spectre."/></div> {error && <div className="notice error" role="alert">{error}</div>}<button className="primary" disabled={!station?.active && !playing} onClick={() => void toggle()}>{playing ? <Pause size={20}/> : <Play size={20}/>} {playing ? 'Mettre en pause' : showVideo || showCamera ? 'Regarder le direct' : 'Écouter la radio'}</button><div className="volume-control"><Volume2 size={20}/><Slider aria-label="Volume de la radio" min={0} max={100} value={[volume]} onValueChange={([v]) => { setVolume(v); if (player.current)
        player.current.gain.gain.value = v / 100; }}/><span>{volume}%</span></div>{station?.live && <p className="help">Le direct arrive avec quelques secondes de décalage.</p>}</div><footer>AFOLUKU TV · A MEDIA FU WI<br/><span>WI MEDIA, WI KULTURU, WI TOLI</span></footer></main>;
}
