import {mediaRedirect} from '@/lib/afoluku-radio/storage';
import { admin, handle, json, db, bucket, check, ApiError } from '@/lib/afoluku-radio/server';
import { imageType } from '@/lib/afoluku-radio/track-media';
import { settingsRow, settingsValue, initializeSettings } from '@/lib/afoluku-radio/settings-server';
export async function DELETE(req) { return handle(async () => { await admin(req); await initializeSettings(); const previous = await settingsRow(); check(req.headers.get('x-settings-version') === String(previous.version), 'Les paramètres ont changé. Rechargez-les.'); const result = await db().prepare('UPDATE radio_settings SET logo_key=NULL,version=version+1 WHERE id=1 AND version=?').bind(previous.version).run(); if (!result.meta.changes)
    throw new ApiError(409, 'Le logo a changé. Rechargez les paramètres.'); if (previous.logo_key)
    try {
        await bucket().delete(previous.logo_key);
    }
    catch { } return json(settingsValue(await settingsRow())); }); }
export async function GET(req){return handle(async()=>{const row=await settingsRow();const v=new URL(req.url).searchParams.get('v');if(!row.logo_key||(v&&v!==row.logo_key.split('/').pop()))throw new ApiError(404,'Logo introuvable.');return mediaRedirect(row.logo_key)});}
