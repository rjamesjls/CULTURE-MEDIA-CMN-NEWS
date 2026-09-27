import { admin, handle, json, db, bucket, body, check, id, stationRow, ApiError } from '@/lib/afoluku-radio/server';
export async function POST(req) {
    return handle(async () => {
        await admin(req);
        const data = await body(req);
        if (data.action === 'start') {
            const row = await stationRow();
            if (row.live_session) {
                const previous = await db().prepare('SELECT updated_at FROM live_sessions WHERE id=?').bind(row.live_session).first();
                if (previous && Date.now() - previous.updated_at < 15000)
                    throw new ApiError(409, 'Un autre direct est déjà actif. Arrêtez-le avant de prendre l’antenne.');
            }
            const session = crypto.randomUUID();
            await db().batch([db().prepare('INSERT INTO live_sessions(id,seq,updated_at) VALUES (?,-1,?)').bind(session, Date.now()), db().prepare('INSERT INTO station(id,live_session) VALUES (1,?) ON CONFLICT(id) DO UPDATE SET live_session=?,revision=station.revision+1').bind(session, session)]);
            return json({ session });
        }
        check(data.action === 'stop', 'Action invalide.');
        const session = id(data.session);
        await db().prepare('UPDATE station SET live_session=NULL,revision=revision+1 WHERE id=1 AND live_session=?').bind(session).run();
        const row = await db().prepare('SELECT seq FROM live_sessions WHERE id=?').bind(session).first();
        if (row) {
            const keys = Array.from({ length: Math.min(12, row.seq + 1) }, (_, i) => `live/${session}/${row.seq - i}.wav`);
            if (keys.length)
                await bucket().delete(keys);
            await db().prepare('DELETE FROM live_sessions WHERE id=?').bind(session).run();
        }
        return json({ ok: true });
    });
}
