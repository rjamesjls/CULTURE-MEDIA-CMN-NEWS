import {mediaRedirect} from '@/lib/afoluku-radio/storage';
import { admin, handle, json, db, bucket, id, check, ApiError, trackVisuals } from '@/lib/afoluku-radio/server';
import { imageType, videoType } from '@/lib/afoluku-radio/track-media';
async function track(trackId) { const t = await db().prepare('SELECT id,cover_key,peaks FROM tracks WHERE id=?').bind(trackId).first(); if (!t)
    throw new ApiError(404, 'Morceau introuvable.'); return t; }
export async function DELETE(req, { params }) { return handle(async () => { await admin(req); const trackId = id((await params).id); const previous = await track(trackId); const result = await db().prepare('UPDATE tracks SET cover_key=NULL WHERE id=? AND cover_key IS ?').bind(trackId, previous.cover_key).run(); if (!result.meta.changes)
    throw new ApiError(409, 'La pochette a changé. Actualisez puis recommencez.'); if (previous.cover_key)
    await bucket().delete(previous.cover_key); return json({ ok: true }); }); }
export async function GET(req,{params}){return handle(async()=>{const t=await track(id((await params).id));const version=new URL(req.url).searchParams.get('v');if(!t.cover_key||(version&&version!==t.cover_key.split('/').pop()))throw new ApiError(404,'Pochette introuvable.');return mediaRedirect(t.cover_key)});}
