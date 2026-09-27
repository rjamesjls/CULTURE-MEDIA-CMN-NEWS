import { admin, ApiError, body, check, db, handle, json, stationRow } from '@/lib/afoluku-radio/server';
import { locate, streamKey } from '@/lib/afoluku-radio/radio';
export const dynamic = 'force-dynamic';
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
export async function GET() {
    return handle(async () => {
        await admin();
        const rows = (await db().prepare("SELECT s.track_id,COUNT(*) AS streams FROM track_streams s JOIN tracks t ON t.id=s.track_id WHERE t.content_kind='music' GROUP BY s.track_id ORDER BY streams DESC,s.track_id").all()).results;
        return json({ total: rows.reduce((sum, row) => sum + row.streams, 0), tracks: rows.map(row => ({ id: row.track_id, streams: row.streams })), updatedAt: Date.now() });
    });
}
export async function POST(req) {
    return handle(async () => {
        const origin = req.headers.get('origin');
        if ((origin && origin !== new URL(req.url).origin) || req.headers.get('sec-fetch-site') === 'cross-site')
            throw new ApiError(403, 'Origine de la requête refusée.');
        const data = await body(req);
        check(data && typeof data === 'object', 'Écoute invalide.');
        const { viewerId, sessionId, sequence, active, trackId, occurrence } = data;
        check(typeof viewerId === 'string' && uuid.test(viewerId) && typeof sessionId === 'string' && uuid.test(sessionId), 'Identifiant invalide.');
        check(Number.isSafeInteger(sequence) && sequence > 0 && typeof active === 'boolean', 'Écoute invalide.');
        check(typeof trackId === 'string' && uuid.test(trackId) && typeof occurrence === 'string' && occurrence.length < 100 && occurrence.startsWith(trackId + ':') && /^\d+$/.test(occurrence.slice(37)), 'Titre invalide.');
        const now = Date.now(), station = await stationRow();
        const current = locate(JSON.parse(station.snapshot), station.started_at, !!station.loop, station.paused_at || now);
        let live = false;
        if (station.live_session) {
            const row = await db().prepare('SELECT seq,updated_at FROM live_sessions WHERE id=?').bind(station.live_session).first();
            live = !!row && row.seq >= 0 && now - row.updated_at < 15000;
        }
        const track = await db().prepare('SELECT content_kind FROM tracks WHERE id=?').bind(trackId).first();
        const eligible = track?.content_kind === 'music' && active && !station.paused_at && !live && (current?.sourceId || current?.id) === trackId && streamKey(current.key, station.stream_clock_shift, current.sourceId) === occurrence;
        // The server clock bounds each credit. Late or duplicate requests cannot add time.
        // Separate attempts per tab; accepted streams deduplicate browser + programme occurrence.
        await db().batch([
            db().prepare(`INSERT INTO stream_attempts(session_id,viewer_id,occurrence,track_id,sequence,active,listened_ms,last_seen) VALUES (?,?,?,?,?,?,0,?)
   ON CONFLICT(session_id) DO UPDATE SET
    listened_ms=CASE WHEN stream_attempts.occurrence=excluded.occurrence THEN
     MIN(30000,stream_attempts.listened_ms+CASE WHEN stream_attempts.active=1 AND excluded.active=1 AND excluded.last_seen-stream_attempts.last_seen BETWEEN 0 AND 12000 THEN excluded.last_seen-stream_attempts.last_seen ELSE 0 END)
     ELSE 0 END,
    occurrence=excluded.occurrence,track_id=excluded.track_id,sequence=excluded.sequence,active=excluded.active,last_seen=excluded.last_seen
   WHERE stream_attempts.sequence<excluded.sequence AND stream_attempts.viewer_id=excluded.viewer_id`).bind(sessionId, viewerId, occurrence, trackId, sequence, eligible ? 1 : 0, now),
            db().prepare(`INSERT INTO track_streams(viewer_id,occurrence,track_id,counted_at)
   SELECT viewer_id,occurrence,track_id,? FROM stream_attempts
   WHERE session_id=? AND sequence=? AND active=1 AND listened_ms>=30000 AND EXISTS(SELECT 1 FROM tracks WHERE id=track_id AND content_kind='music')
   ON CONFLICT(viewer_id,occurrence) DO NOTHING`).bind(now, sessionId, sequence),
            db().prepare('DELETE FROM stream_attempts WHERE last_seen<?').bind(now - 600000)
        ]);
        return json({ ok: true });
    });
}
