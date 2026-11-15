import { db, admin, check, ApiError } from "@/lib/afoluku-radio/server";
async function hash(value) {
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))), (n) => n.toString(16).padStart(2, "0")).join("");
}
function origin(req) {
  check(!req.headers.get("origin") || req.headers.get("origin") === new URL(req.url).origin, "Origine refus\xE9e.");
  check(req.headers.get("sec-fetch-site") !== "cross-site", "Origine refus\xE9e.");
}
async function access(req, id) {
  origin(req);
  await ready();
  const room = await db().prepare("SELECT * FROM afoluku_interviews.rooms WHERE id=?").bind(id).first();
  if (!room) throw new ApiError(404, "Interview introuvable.");
  if (room.closed || room.expires_at < Date.now()) throw new ApiError(410, "Cette invitation est termin\xE9e ou expir\xE9e.");
  const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
  if (token) {
    check(token.length < 200, "Invitation invalide.");
    if (await hash(token) !== room.token_hash) throw new ApiError(403, "Invitation invalide.");
    return { room, host: false };
  }
  await admin(req);
  return { room, host: true };
}
function description(value, type) {
  check(typeof value === "object" && value !== null, "Connexion invalide.");
  const d = value;
  check(d.type === type && typeof d.sdp === "string" && d.sdp.length < 6e4, "Connexion invalide.");
  return JSON.stringify({ type, sdp: d.sdp });
}
function config() {
  const e = process.env;
  const servers = [{ urls: "stun:stun.l.google.com:19302" }];
  if (e.INTERVIEW_TURN_URL && e.INTERVIEW_TURN_USERNAME && e.INTERVIEW_TURN_CREDENTIAL) servers.push({ urls: e.INTERVIEW_TURN_URL.split(",").map((s) => s.trim()), username: e.INTERVIEW_TURN_USERNAME, credential: e.INTERVIEW_TURN_CREDENTIAL });
  return { iceServers: servers, relayConfigured: servers.length > 1 };
}
function publicRoom(room) {
  return { id: room.id, title: room.title, hostName: room.host_name, guestName: room.guest_name, expiresAt: room.expires_at, hostOnline: Date.now() - room.host_seen < 2e4, guestOnline: !!room.guest_client && Date.now() - room.guest_seen < 2e4, offerId: room.offer_id, offer: room.offer ? JSON.parse(room.offer) : null, answer: room.answer ? JSON.parse(room.answer) : null, recording: !!room.recording };
}
export {
  access,
  config,
  description,
  hash,
  origin,
  publicRoom
};

let initialization;
export function ready(){
 if(!initialization)initialization=(async()=>{
  await db().prepare('CREATE SCHEMA IF NOT EXISTS afoluku_interviews').run();
  await db().prepare(`CREATE TABLE IF NOT EXISTS afoluku_interviews.rooms(
   id TEXT PRIMARY KEY,title TEXT NOT NULL,host_name TEXT NOT NULL,guest_name TEXT NOT NULL DEFAULT 'Invité',
   token_hash TEXT NOT NULL,created_at BIGINT NOT NULL,expires_at BIGINT NOT NULL,closed INTEGER NOT NULL DEFAULT 0,
   guest_client TEXT,host_seen BIGINT NOT NULL DEFAULT 0,guest_seen BIGINT NOT NULL DEFAULT 0,
   offer_id TEXT,offer TEXT,answer TEXT,recording INTEGER NOT NULL DEFAULT 0
  )`).run();
 })().catch(error=>{initialization=null;throw error;});
 return initialization;
}
