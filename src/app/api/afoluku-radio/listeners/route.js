import { admin, ApiError, body, check, db, handle, json, stationRow } from '@/lib/afoluku-radio/server';
import { locate } from '@/lib/afoluku-radio/radio';
export const dynamic = 'force-dynamic';
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
async function broadcasting(now) {
    const station = await stationRow();
    if (!station.paused_at && locate(JSON.parse(station.snapshot), station.started_at, !!station.loop, now))
        return true;
    if (!station.live_session)
        return false;
    const live = await db().prepare('SELECT seq,updated_at FROM live_sessions WHERE id=?').bind(station.live_session).first();
    return !!live && live.seq >= 0 && now - live.updated_at < 15000;
}
export async function GET() {
    return handle(async () => {
        await admin();
        const now = Date.now();
        const result = await db().prepare('SELECT COUNT(DISTINCT viewer_id) AS count FROM listener_sessions WHERE active=1 AND updated_at>=?').bind(now - 45000).first();
        return json({ count: await broadcasting(now) ? result?.count || 0 : 0, updatedAt: now });
    });
}
export async function POST(req) {
    return handle(async () => {
        const origin = req.headers.get('origin');
        if ((origin && origin !== new URL(req.url).origin) || req.headers.get('sec-fetch-site') === 'cross-site')
            throw new ApiError(403, 'Origine de la requête refusée.');
        const data = await body(req);
        check(data && typeof data === 'object', 'Présence invalide.');
        const { viewerId, sessionId, sequence, active } = data;
        check(typeof viewerId === 'string' && uuid.test(viewerId) && typeof sessionId === 'string' && uuid.test(sessionId), 'Identifiant invalide.');
        check(Number.isSafeInteger(sequence) && sequence > 0 && typeof active === 'boolean', 'Présence invalide.');
        const now = Date.now();
        const listening = active && await broadcasting(now);
        // Keep stopped sessions briefly: a late heartbeat cannot undo a newer pause.
        await db().batch([
            db().prepare(`INSERT INTO listener_sessions (id,viewer_id,sequence,active,updated_at) VALUES (?,?,?,?,?)
   ON CONFLICT(id) DO UPDATE SET sequence=excluded.sequence,active=excluded.active,updated_at=excluded.updated_at
   WHERE listener_sessions.sequence<excluded.sequence AND listener_sessions.viewer_id=excluded.viewer_id`).bind(sessionId, viewerId, sequence, listening ? 1 : 0, now),
            db().prepare('DELETE FROM listener_sessions WHERE updated_at<?').bind(now - 300000)
        ]);
        return json({ ok: true });
    });
}
