import { admin, handle, json, body, check, db, id, ApiError } from '@/lib/afoluku-radio/server';
import { cameraConfigured, requireCameraConfig, initializeCamera, cameraState, cameraToken, removeCameraRoom } from '@/lib/afoluku-radio/camera-server';
export async function GET(req) { return handle(async()=>{await admin(req);return json({configured:cameraConfigured()});}); }
export async function POST(req) { return handle(async()=>{
 const data=await body(req);
 if(data.action==='watch') {
  const current=await cameraState();
  if(!current)throw new ApiError(404,'Aucun direct caméra en cours.');
  check(data.session===current.session,'Le direct caméra a changé.');
  return json(await cameraToken(current.session));
 }
 const user=await admin(req);
 check(['start','pulse','stop'].includes(data.action),'Action inconnue.');
 requireCameraConfig();await initializeCamera();
 if(data.action==='start') {
  const session=crypto.randomUUID();
  const result=await db().prepare('INSERT INTO afoluku_radio.camera_state(id,session,owner_id,updated_at,ready) VALUES(1,?,?,?,false) ON CONFLICT(id) DO UPDATE SET session=excluded.session,owner_id=excluded.owner_id,updated_at=excluded.updated_at,ready=false WHERE afoluku_radio.camera_state.updated_at<?').bind(session,user.id,Date.now(),Date.now()-20000).run();
  if(!result.meta.changes)throw new ApiError(409,'Un direct caméra est déjà en cours dans une régie.');
  return json(await cameraToken(session,true));
 }
 const session=id(data.session);
 if(data.action==='pulse') {
  const result=await db().prepare('UPDATE afoluku_radio.camera_state SET updated_at=?,ready=true WHERE id=1 AND session=? AND owner_id=? AND updated_at>?').bind(Date.now(),session,user.id,Date.now()-20000).run();
  if(!result.meta.changes)throw new ApiError(409,'Le direct caméra a expiré ou a été arrêté. Relancez-le.');
 } else {
  const result=await db().prepare('DELETE FROM afoluku_radio.camera_state WHERE id=1 AND session=? AND owner_id=?').bind(session,user.id).run();
  if(result.meta.changes)await removeCameraRoom(session);
 }
 return json({ok:true});
}); }
