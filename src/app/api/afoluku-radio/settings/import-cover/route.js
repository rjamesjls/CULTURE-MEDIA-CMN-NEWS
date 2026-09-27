import { admin, handle, json, db, ApiError } from '@/lib/afoluku-radio/server';
import { settingsRow, settingsValue, initializeSettings } from '@/lib/afoluku-radio/settings-server';
import { mediaRedirect } from '@/lib/afoluku-radio/storage';
export async function GET(req){return handle(async()=>{const row=await settingsRow(),key=JSON.parse(row.payload).importCoverKey,version=new URL(req.url).searchParams.get('v');if(!key||(version&&version!==key.split('/').pop()))throw new ApiError(404,'Image introuvable.');return mediaRedirect(key);});}
export async function DELETE(req){return handle(async()=>{
 await admin(req);await initializeSettings();const previous=await settingsRow();
 if(req.headers.get('x-settings-version')!==String(previous.version))throw new ApiError(409,'Les paramètres ont changé. Rechargez-les.');
 const payload=JSON.stringify({...JSON.parse(previous.payload),importCoverKey:null});
 const result=await db().prepare('UPDATE radio_settings SET payload=?,version=version+1 WHERE id=1 AND version=?').bind(payload,previous.version).run();
 if(!result.meta.changes)throw new ApiError(409,'Les paramètres ont changé. Rechargez-les.');
 // Immutable shared artwork remains available on titles that already inherited it.
 return json(settingsValue(await settingsRow()));
});}
