import { admin, ApiError, body, check, db, handle, id, json } from '@/lib/afoluku-radio/server';
import { validContentKind, validMusicGenre } from '@/lib/afoluku-radio/track-classification';
export async function PUT(req, { params }) {
    return handle(async () => {
        await admin(req);
        const trackId = id((await params).id), data = await body(req);
        check(data && validContentKind(data.contentKind), 'Choisissez un type de contenu valide.');
        check(data.musicGenre === null || validMusicGenre(data.musicGenre), 'Choisissez une des trois catégories musicales.');
        check(data.contentKind === 'music' || data.musicGenre === null, 'Les catégories musicales sont réservées aux musiques.');
        const previous = await db().prepare('SELECT content_kind FROM tracks WHERE id=?').bind(trackId).first();
        if (!previous)
            throw new ApiError(404, 'Titre introuvable.');
        await db().batch([
            db().prepare('UPDATE tracks SET content_kind=?,music_genre=? WHERE id=?').bind(data.contentKind, data.musicGenre, trackId),
            // Do not carry listening time across a music/non-music classification change.
            ...(previous.content_kind !== data.contentKind ? [db().prepare('DELETE FROM stream_attempts WHERE track_id=?').bind(trackId)] : [])
        ]);
        return json({ ok: true, contentKind: data.contentKind, musicGenre: data.musicGenre });
    });
}
