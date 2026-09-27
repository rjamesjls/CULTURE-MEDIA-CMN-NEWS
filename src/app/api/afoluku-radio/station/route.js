import { admin, handle, json, db, body, check, id, state, stationRow, playlistSnapshot, ApiError, getTracks } from '@/lib/afoluku-radio/server';
import { locate, replaceUpcoming, rebaseProgramme } from '@/lib/afoluku-radio/radio';
import {cancelScheduledTimeline} from '@/lib/afoluku-radio/timeline-server';
import { stopCurrentCamera } from '@/lib/afoluku-radio/camera-server';
export const dynamic = 'force-dynamic';
export async function GET() { return handle(async () => json(await state())); }
export async function POST(req) {
    return handle(async () => {
        await admin(req);
        const data = await body(req);
        check(['previous', 'seek', 'start', 'stop', 'pause', 'resume', 'next', 'loop', 'queue-update', 'queue-load', 'queue-start'].includes(data.action), 'Action inconnue.');
        const row = await stationRow();
        const now = Date.now();
        const tracks = JSON.parse(row.snapshot);
        const clock = row.paused_at || now;
        const current = locate(tracks, row.started_at, !!row.loop, clock);
        const timeline=tracks[0]?.timelineStart!==undefined;
        if(timeline && row.started_at && (data.action.startsWith('queue-') || data.action==='loop'))throw new ApiError(409,'Modifiez la timeline puis remettez-la à l’antenne. Pour revenir à une playlist, arrêtez la diffusion puis rechargez la file.');
        if(timeline && ['next','previous'].includes(data.action)) {
            if(data.revision!==row.revision)throw new ApiError(409,'La programmation a changé. Actualisez.');
            if(row.live_session){const live=await db().prepare('SELECT updated_at FROM live_sessions WHERE id=?').bind(row.live_session).first();if(live&&now-live.updated_at<15000)throw new ApiError(409,'Terminez le direct micro avant de changer de passage.');}
            const elapsed=(clock-row.started_at)/1000;
            const index=current?current.index:tracks.findIndex(t=>t.timelineStart>elapsed);
            const target=data.action==='previous'?Math.max(0,(index<0?tracks.length:index)-1):(current?index+1:index);
            check(row.started_at && target>=0 && target<tracks.length,'Aucun autre passage dans cette direction.');
            const result=await db().prepare('UPDATE station SET started_at=?,stream_clock_shift=0,revision=revision+1 WHERE id=1 AND revision=?').bind(clock-Math.round(tracks[target].timelineStart*1000),row.revision).run();
            if(!result.meta.changes)throw new ApiError(409,'La programmation a changé.');
            return json(await state());
        }
        if(data.action==='previous')throw new ApiError(400,'Le retour au passage précédent est disponible pour une timeline.');
        if (data.action === 'seek') {
            if (data.revision !== row.revision || data.currentKey !== current?.key)
                throw new ApiError(409, 'Le titre a changé. Actualisez puis recommencez.');
            check(current, 'Aucun titre à déplacer.');
            const relative = Object.hasOwn(data, 'delta');
            const value = relative ? data.delta : data.position;
            check(typeof value === 'number' && Number.isFinite(value), 'Position invalide.');
            check(relative ? Math.abs(value) <= 3600 : value >= 0 && value < current.duration, 'Choisissez une position dans la durée du titre.');
            if (row.live_session) {
                const live = await db().prepare('SELECT updated_at FROM live_sessions WHERE id=?').bind(row.live_session).first();
                if (live && now - live.updated_at < 15000)
                    throw new ApiError(409, 'Terminez la prise de parole avant de déplacer la musique à l’antenne.');
            }
            const position = Math.max(0, Math.min(current.duration - 0.05, relative ? current.offset + value : value));
            const shift = Math.round((current.offset - position) * 1000);
            const result = await db().prepare('UPDATE station SET started_at=?,stream_clock_shift=?,revision=revision+1 WHERE id=1 AND revision=?').bind(row.started_at + shift, row.stream_clock_shift + shift, row.revision).run();
            if (!result.meta.changes)
                throw new ApiError(409, 'La programmation a changé. Actualisez puis recommencez.');
        }
        if (data.action === 'pause' || data.action === 'resume') {
            if (data.revision !== row.revision)
                throw new ApiError(409, 'La programmation a changé. Actualisez puis recommencez.');
            check(current || (timeline && row.started_at), 'Aucune musique à mettre en pause ou à reprendre.');
            const paused = data.action === 'pause';
            if (paused !== !!row.paused_at) {
                const result = await db().prepare('UPDATE station SET started_at=?,paused_at=?,stream_clock_shift=?,revision=revision+1 WHERE id=1 AND revision=?').bind(paused ? row.started_at : row.started_at + now - row.paused_at, paused ? now : 0, paused ? row.stream_clock_shift : row.stream_clock_shift + now - row.paused_at, row.revision).run();
                if (!result.meta.changes)
                    throw new ApiError(409, 'La programmation a changé. Actualisez puis recommencez.');
            }
        }
        if (data.action.startsWith('queue-')) {
            if (data.revision !== row.revision || data.currentKey !== (current?.key || null))
                throw new ApiError(409, 'La file a évolué ou le titre suivant a commencé. La liste a été actualisée : recommencez votre action.');
            let next;
            let label = row.playlist_name || 'File de diffusion';
            let startedAt = row.started_at;
            if (data.action === 'queue-start') {
                check(!current, 'La radio diffuse déjà un titre.');
                check(tracks.length, 'Ajoutez des musiques dans la liste À venir.');
                next = tracks;
                startedAt = now;
            }
            else {
                let incoming;
                if (data.action === 'queue-load') {
                    const p = await playlistSnapshot(id(data.playlistId));
                    incoming = p.tracks;
                    label = p.name;
                }
                else {
                    check(Array.isArray(data.trackIds) && data.trackIds.length <= 999, 'La file peut contenir 999 titres à venir maximum.');
                    const known = new Map((await getTracks()).map(t => [t.id, t]));
                    check(data.trackIds.every((v) => typeof v === 'string' && known.has(v)), 'Un morceau n’est plus disponible.');
                    incoming = data.trackIds.map((v) => { const t = known.get(v); return { id: v, title: String(t.title), duration: Number(t.duration), mime: t.mime }; });
                }
                check(incoming.length <= 999, 'La file peut contenir 999 titres à venir maximum.');
                const changed = replaceUpcoming(tracks, row.started_at, !!row.loop, clock, incoming);
                next = changed.tracks;
                startedAt = changed.startedAt;
            }
            const result = row.revision === 0
                ? await db().prepare('INSERT INTO station(id,snapshot,playlist_name,started_at,loop,revision) VALUES (1,?,?,?,?,1) ON CONFLICT(id) DO NOTHING').bind(JSON.stringify(next), label, startedAt, data.action === 'queue-start' ? (data.loop ? 1 : 0) : row.loop).run()
                : await db().prepare('UPDATE station SET snapshot=?,playlist_name=?,started_at=?,loop=?,paused_at=?,stream_clock_shift=?,revision=revision+1 WHERE id=1 AND revision=?').bind(JSON.stringify(next), label, startedAt, data.action === 'queue-start' ? (data.loop ? 1 : 0) : row.loop, data.action === 'queue-start' ? 0 : row.paused_at, data.action === 'queue-start' ? 0 : row.stream_clock_shift, row.revision).run();
            if (!result.meta.changes)
                throw new ApiError(409, 'La file a été modifiée dans une autre fenêtre. Actualisez puis recommencez.');
        }
        if (data.action === 'start') {
            const p = await playlistSnapshot(id(data.playlistId));
            await db().prepare('INSERT INTO station(id,snapshot,playlist_name,started_at,loop,revision) VALUES (1,?,?,?,?,1) ON CONFLICT(id) DO UPDATE SET snapshot=excluded.snapshot,playlist_name=excluded.playlist_name,started_at=excluded.started_at,loop=excluded.loop,paused_at=0,stream_clock_shift=0,revision=station.revision+1').bind(JSON.stringify(p.tracks), p.name, now, data.loop ? 1 : 0).run();
        }
        if (data.action === 'stop') {
            await cancelScheduledTimeline();
            await stopCurrentCamera();
            await db().prepare('UPDATE station SET started_at=0,paused_at=0,stream_clock_shift=0,live_session=NULL,revision=revision+1 WHERE id=1').run();
        }
        if (data.action === 'loop') {
            check(typeof data.loop === 'boolean', 'Choisissez un mode de lecture valide.');
            const rebased = rebaseProgramme(tracks, row.started_at, !!row.loop, clock);
            const result = await db().prepare('INSERT INTO station(id,snapshot,started_at,loop,revision) VALUES (1,?,?,?,1) ON CONFLICT(id) DO UPDATE SET snapshot=excluded.snapshot,started_at=excluded.started_at,loop=excluded.loop,revision=station.revision+1 WHERE station.revision=?').bind(JSON.stringify(rebased.tracks), rebased.startedAt, data.loop ? 1 : 0, row.revision).run();
            if (!result.meta.changes)
                throw new ApiError(409, 'La programmation a changé. Actualisez puis recommencez.');
        }
        if (data.action === 'next') {
            if (row.live_session) {
                const live = await db().prepare('SELECT updated_at FROM live_sessions WHERE id=?').bind(row.live_session).first();
                if (live && now - live.updated_at < 15000)
                    throw new ApiError(409, 'Revenez en programmation avant de passer au titre suivant.');
            }
            check(current, 'Aucune programmation en cours.');
            let next = current.index + 1;
            let result;
            if (next === tracks.length && !row.loop) {
                result = await db().prepare("UPDATE station SET started_at=0,paused_at=0,stream_clock_shift=0,snapshot='[]',live_session=NULL,revision=revision+1 WHERE id=1 AND revision=?").bind(row.revision).run();
            }
            else {
                next %= tracks.length;
                const offset = tracks.slice(0, next).reduce((s, t) => s + t.duration, 0);
                result = await db().prepare('UPDATE station SET started_at=?,live_session=NULL,revision=revision+1 WHERE id=1 AND revision=?').bind(clock - Math.round(offset * 1000), row.revision).run();
            }
            if (!result.meta.changes)
                throw new ApiError(409, 'La programmation a changé. Actualisez puis recommencez.');
        }
        return json(await state());
    });
}
