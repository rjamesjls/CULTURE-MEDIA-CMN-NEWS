import { admin, handle, json, db, id, body, check, ApiError } from '@/lib/afoluku-radio/server';
import { validPeaks } from '@/lib/afoluku-radio/track-media';
export async function PUT(req, { params }) { return handle(async () => { await admin(req); const trackId = id((await params).id); const data = await body(req); check(validPeaks(data.peaks), 'La forme d’onde doit contenir 128 amplitudes entre 0 et 1.'); const result = await db().prepare('UPDATE tracks SET peaks=? WHERE id=?').bind(JSON.stringify(data.peaks), trackId).run(); if (!result.meta.changes)
    throw new ApiError(404, 'Morceau introuvable.'); return json({ ok: true }); }); }
