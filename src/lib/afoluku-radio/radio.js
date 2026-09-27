export function timelineClock(tracks, startedAt, loop, now) {
    const length = Math.max(0, ...tracks.map(t => t.timelineStart + t.duration));
    const elapsed = (now - startedAt) / 1000;
    const cycle = loop && length > 0 && elapsed >= 0 ? Math.floor(elapsed / length) : 0;
    return { position: elapsed - cycle * length, cycleStart: startedAt + cycle * length * 1000 };
}
// An edited queue plays consecutively; the saved timeline remains available separately.
export function queueTrack(track) {
    return { id: track.id, title: track.title, duration: track.duration,
        ...(track.mime ? { mime: track.mime } : {}), ...(track.sourceId ? { sourceId: track.sourceId } : {}) };
}
export function locate(tracks, startedAt, loop, now) {
    if (!startedAt || !tracks.length || tracks.some(t => !Number.isFinite(t.duration) || t.duration <= 0))
        return null;
    if (tracks[0].timelineStart !== undefined) {
        const {position:elapsed,cycleStart}=timelineClock(tracks,startedAt,loop,now);
        const index=tracks.findIndex(t=>elapsed>=t.timelineStart && elapsed<t.timelineStart+t.duration);
        if(index<0)return null;
        const t=tracks[index],offset=elapsed-t.timelineStart;
        return {...t,index,offset,endsAt:cycleStart+(t.timelineStart+t.duration)*1000,key:`${t.id}:${Math.round(cycleStart+t.timelineStart*1000)}`};
    }
    const total = tracks.reduce((sum, t) => sum + t.duration, 0);
    const elapsed = Math.max(0, (now - startedAt) / 1000);
    if (!loop && elapsed >= total)
        return null;
    const cycle = loop ? Math.floor(elapsed / total) : 0;
    let offset = loop ? elapsed % total : elapsed;
    let before = 0;
    for (let i = 0; i < tracks.length; i++) {
        const t = tracks[i];
        if (offset < t.duration)
            return { ...t, index: i, offset, endsAt: now + (t.duration - offset) * 1000, key: `${t.id}:${Math.round(startedAt + (cycle * total + before) * 1000)}` };
        offset -= t.duration;
        before += t.duration;
    }
    return null;
}
export const seconds = (n) => `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, '0')}`;
// The queue is the next pass through the programme, excluding the current occurrence.
export function upcoming(tracks, startedAt, loop, now) {
    if(startedAt && tracks[0]?.timelineStart !== undefined) {
        const {position}=timelineClock(tracks,startedAt,loop,now);
        const future=tracks.filter(t=>t.timelineStart>position);
        return loop ? [...future,...tracks.filter(t=>t.timelineStart+t.duration<=position)] : future;
    }
    const current = locate(tracks, startedAt, loop, now);
    if (!startedAt)
        return tracks;
    if (!current)
        return [];
    return [...tracks.slice(current.index + 1), ...(loop ? tracks.slice(0, current.index) : [])];
}
export function replaceUpcoming(tracks, startedAt, loop, now, next) {
    const current = locate(tracks, startedAt, loop, now);
    if (!current)
        return { tracks: next.map(queueTrack), startedAt: 0 };
    const playing = queueTrack(current);
    return { tracks: [playing, ...next.map(queueTrack)], startedAt: Math.round(current.endsAt - current.duration * 1000) };
}
// Rebase on the current occurrence so a loop change never rewinds or ends a later cycle.
export function rebaseProgramme(tracks, startedAt, loop, now) {
    const current = locate(tracks, startedAt, loop, now);
    if (!current)
        return { tracks: startedAt ? [] : tracks, startedAt: 0 };
    return replaceUpcoming(tracks, startedAt, loop, now, upcoming(tracks, startedAt, loop, now));
}
export function moveEntry(items, from, before) {
    if (!Number.isInteger(from) || !Number.isInteger(before) || from < 0 || from >= items.length || before < 0 || before > items.length)
        throw new Error('Déplacement invalide.');
    const next = [...items];
    const [entry] = next.splice(from, 1);
    next.splice(before > from ? before - 1 : before, 0, entry);
    return next;
}
// Pausing shifts the playback clock, but must not create a second stream occurrence.
export function streamKey(key, clockShift, sourceId) { const split = key.lastIndexOf(':'); return (sourceId ? `${sourceId}:` : key.slice(0, split + 1)) + (Number(key.slice(split + 1)) - clockShift); }
