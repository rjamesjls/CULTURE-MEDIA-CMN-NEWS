import {radioDatabase} from './postgres';
import {radioBucket} from './storage';
import {createClient} from '@/utils/supabase/server';

import {activateScheduledTimeline,pendingTimeline} from './timeline-server';
import { cameraState } from './camera-server';
import { timelineClock, locate, upcoming, streamKey } from './radio';
export class ApiError extends Error {
    status;
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}
export function db(){return radioDatabase;}
export function bucket(){return radioBucket;}
export function json(value, status = 200) { return Response.json(value, { status, headers: { 'Cache-Control': 'no-store' } }); }
export async function handle(work) { try {
    return await work();
}
catch (e) {
    if(e?.radioConfiguration)return json({error:'La radio doit être configurée par l’administrateur du site.'},503);
        if (e instanceof ApiError)
        return json({ error: e.message }, e.status);
    console.error('Radio API', e);
    return json({ error: 'Une erreur est survenue. Vos données existantes sont conservées. Réessayez.' }, 500);
} }
export async function admin(req){
 if(req){const origin=req.headers.get('origin');if((origin&&origin!==new URL(req.url).origin)||req.headers.get('sec-fetch-site')==='cross-site')throw new ApiError(403,'Origine de la requête refusée.');}
 const supabase=await createClient();const {data:{user},error}=await supabase.auth.getUser();
 if(error||!user)throw new ApiError(401,'Connectez-vous à votre compte administrateur.');
 const {data:profile,error:profileError}=await supabase.from('profiles').select('role,status').eq('id',user.id).single();
 if(profileError||profile?.role!=='admin'||profile.status!=='active')throw new ApiError(403,'La régie est réservée aux administrateurs actifs du site.');
 return user;
}
export function check(value, message) { if (!value)
    throw new ApiError(400, message); }
export function id(value) { check(typeof value === 'string' && /^[a-f0-9-]{36}$/.test(value), 'Identifiant invalide.'); return value; }
export async function body(req) { check(req.headers.get('content-type')?.includes('application/json'), 'Requête JSON requise.'); const text = await req.text(); check(text.length < 100000, 'Requête trop volumineuse.'); try {
    return JSON.parse(text);
}
catch {
    throw new ApiError(400, 'Requête invalide.');
} }
export async function stationRow() { await activateScheduledTimeline(); return await db().prepare('SELECT * FROM station WHERE id=1').first() || { snapshot: '[]', playlist_name: '', started_at: 0, paused_at: 0, stream_clock_shift: 0, loop: 1, live_session: null, revision: 0 }; }
export async function state() {
    const row = await stationRow();
    const now = Date.now();
    const current = locate(JSON.parse(row.snapshot), row.started_at, !!row.loop, row.paused_at || now);
    let live = null;
    const visualRows = (await db().prepare('SELECT id,cover_key,peaks,mime,content_kind,music_genre FROM tracks').all()).results;
    const visuals = new Map(visualRows.map(t => [t.id, { ...trackVisuals(t), mime: t.mime, contentKind: t.content_kind, musicGenre: t.music_genre }]));
    if (current)
        Object.assign(current, visuals.get(current.sourceId || current.id), { mime: visuals.get(current.id)?.mime, peaks: visuals.get(current.id)?.peaks }, { paused: !!row.paused_at, streamTrackId: current.sourceId || current.id, streamKey: streamKey(current.key, row.stream_clock_shift, current.sourceId) });
    if (row.live_session) {
        const s = await db().prepare('SELECT * FROM live_sessions WHERE id=?').bind(row.live_session).first();
        if (s && s.seq >= 0 && now - s.updated_at < 15000)
            live = { session: s.id, seq: s.seq, updatedAt: s.updated_at };
    }
    const camera = await cameraState();
    const snapshot=JSON.parse(row.snapshot);
    return { scheduledTimeline: await pendingTimeline(), timeline: snapshot[0]?.timelineStart !== undefined ? { startedAt:row.started_at, position:timelineClock(snapshot,row.started_at,!!row.loop,row.paused_at||now).position, entries:snapshot } : null, serverNow: now, camera, active: (!!current && !row.paused_at) || !!live || !!camera, paused: !!row.paused_at, playlistName: row.playlist_name, loop: !!row.loop, current, live, revision: row.revision, upcoming: upcoming(JSON.parse(row.snapshot), row.started_at, !!row.loop, row.paused_at || now).map(t => ({ ...t, coverUrl: visuals.get(t.sourceId || t.id)?.coverUrl, coverType: visuals.get(t.sourceId || t.id)?.coverType, mime: visuals.get(t.id)?.mime })) };
}
export function trackVisuals(t) { return { coverType: (/\.(mp4|webm)$/.test(t.cover_key || '') ? 'video' : 'image'), coverUrl: t.cover_key ? `/api/afoluku-radio/tracks/${t.id}/cover?v=${t.cover_key.split('/').pop()}` : null, peaks: JSON.parse(t.peaks || '[]') }; }
export async function getTracks() { return (await db().prepare('SELECT * FROM tracks ORDER BY created_at DESC').all()).results.map(t => ({ id: t.id, title: t.title, duration: t.duration, bytes: t.bytes, mime: t.mime, contentKind: t.content_kind, musicGenre: t.music_genre, ...trackVisuals(t) })); }
export async function getPlaylists() { return (await db().prepare('SELECT * FROM playlists ORDER BY updated_at DESC').all()).results.map(p => ({ id: p.id, name: p.name, trackIds: JSON.parse(p.track_ids), version: p.version })); }
export async function playlistSnapshot(playlistId) { const p = await db().prepare('SELECT * FROM playlists WHERE id=?').bind(playlistId).first(); check(p, 'Playlist introuvable.'); const all = await getTracks(); const ids = JSON.parse(p.track_ids); const tracks = ids.map(id => all.find(t => t.id === id)).filter(Boolean).map(t => ({ id: String(t.id), title: String(t.title), duration: Number(t.duration), mime: t.mime })); check(tracks.length, 'Ajoutez au moins un morceau à cette playlist.'); return { name: p.name, tracks }; }
