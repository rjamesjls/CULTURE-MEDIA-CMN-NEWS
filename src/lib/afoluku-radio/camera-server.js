import { AccessToken, RoomServiceClient, TrackSource } from 'livekit-server-sdk';
import { db, ApiError } from './server';
export function cameraConfigured() { return !!(process.env.LIVEKIT_URL && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET); }
export function requireCameraConfig() {
    if (!cameraConfigured()) throw new ApiError(503, 'Le relais caméra reste à configurer : LIVEKIT_URL, LIVEKIT_API_KEY et LIVEKIT_API_SECRET dans Vercel. L’aperçu local reste disponible.');
    if (!process.env.LIVEKIT_URL.startsWith('wss://')) throw new ApiError(503, 'LIVEKIT_URL doit commencer par wss://.');
}
let initialized;
export async function initializeCamera() {
    initialized ||= (async()=>{
    await db().prepare('CREATE TABLE IF NOT EXISTS afoluku_radio.camera_state (id integer PRIMARY KEY CHECK (id=1), session text NOT NULL, owner_id text NOT NULL, updated_at bigint NOT NULL, ready boolean NOT NULL DEFAULT false)').run();
    await db().prepare('REVOKE ALL ON afoluku_radio.camera_state FROM anon, authenticated').run();
    })().catch(error=>{initialized=undefined;throw error;});
    await initialized;
}
export async function cameraState() {
    if (!cameraConfigured()) return null;
    try {
        const row = await db().prepare('SELECT session FROM afoluku_radio.camera_state WHERE id=1 AND ready=true AND updated_at>?').bind(Date.now()-20000).first();
        return row ? { session: row.session } : null;
    } catch (error) { if (error.code === '42P01') return null; throw error; }
}
export async function cameraToken(session, publish = false) {
    requireCameraConfig();
    const token = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, { identity: publish ? `studio-${session}` : `viewer-${crypto.randomUUID()}`, ttl: '5m' });
    token.addGrant({roomJoin:true,room:`afoluku-${session}`,canPublish:publish,canSubscribe:!publish,canPublishData:false,...(publish?{canPublishSources:[TrackSource.CAMERA,TrackSource.MICROPHONE]}:{})});
    return { url:process.env.LIVEKIT_URL, token:await token.toJwt(), session };
}
export async function removeCameraRoom(session) {
    if (!cameraConfigured()) return;
    const client = new RoomServiceClient(process.env.LIVEKIT_URL.replace('wss://','https://'),process.env.LIVEKIT_API_KEY,process.env.LIVEKIT_API_SECRET);
    try { await client.deleteRoom(`afoluku-${session}`); } catch { /* Expired rooms are also cleaned up by the provider. */ }
}

export async function stopCurrentCamera() {
 if(!cameraConfigured())return;
 try {
  const row=await db().prepare('DELETE FROM afoluku_radio.camera_state WHERE id=1 RETURNING session').first();
  if(row)await removeCameraRoom(row.session);
 }catch(error){if(error.code!=='42P01')throw error;}
}
