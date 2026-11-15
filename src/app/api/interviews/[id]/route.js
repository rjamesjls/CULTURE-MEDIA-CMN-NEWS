import { body, check, db, handle, json, ApiError } from "@/lib/afoluku-radio/server";
import { access, description, config, publicRoom, hash } from "@/lib/interviews/server";
export const dynamic = "force-dynamic";
async function GET(req, ctx) {
  return handle(async () => {
    const { room } = await access(req, (await ctx.params).id);
    return json({ ...publicRoom(room), ...config() });
  });
}
async function POST(req, ctx) {
  return handle(async () => {
    const id = (await ctx.params).id;
    const { room, host } = await access(req, id);
    const d = await body(req);
    const now = Date.now();
    if (host) {
      if(d.action==='invite'){
        check(!room.recording&&now-room.guest_seen>20000,'Attendez le départ de l’invité avant de renouveler le lien.');
        const token=crypto.randomUUID()+crypto.randomUUID();
        await db().prepare('UPDATE afoluku_interviews.rooms SET token_hash=?,guest_client=NULL,guest_seen=0,offer=NULL,offer_id=NULL,answer=NULL WHERE id=?').bind(await hash(token),id).run();
        return json({token});
      }

      if (d.action === "offer") {
        check(typeof d.offerId === "string" && d.offerId.length < 80, "Connexion invalide.");
        await db().prepare("UPDATE afoluku_interviews.rooms SET offer_id=?,offer=?,answer=NULL,host_seen=? WHERE id=?").bind(d.offerId, description(d.description, "offer"), now, id).run();
      } else if (d.action === "heartbeat") await db().prepare("UPDATE afoluku_interviews.rooms SET host_seen=? WHERE id=?").bind(now, id).run();
      else if (d.action === "record") {
        check(typeof d.recording === "boolean", "\xC9tat invalide.");
        await db().prepare("UPDATE afoluku_interviews.rooms SET recording=? WHERE id=?").bind(d.recording ? 1 : 0, id).run();
      } else if (d.action === "close") await db().prepare("UPDATE afoluku_interviews.rooms SET closed=1,recording=0,offer=NULL,answer=NULL,token_hash=? WHERE id=?").bind(crypto.randomUUID(), id).run();
      else throw new ApiError(400, "Action inconnue.");
    } else {
      check(typeof d.client === "string" && /^[a-f0-9-]{36}$/.test(d.client), "Session invalide.");
      if (d.action === "join") {
        check(typeof d.name === "string" && d.name.trim() && d.name.length <= 60, "Indiquez votre nom.");
        check(d.consent === true, "Acceptez l\u2019enregistrement \xE9ventuel pour rejoindre.");
        const result = await db().prepare("UPDATE afoluku_interviews.rooms SET guest_client=?,guest_name=?,guest_seen=?,answer=NULL,offer=NULL,offer_id=NULL WHERE id=? AND (guest_client IS NULL OR guest_client=? OR guest_seen<?)").bind(d.client, d.name.trim(), now, id, d.client, now - 3e4).run();
        if (!result.meta.changes) throw new ApiError(409, "Un invit\xE9 est d\xE9j\xE0 connect\xE9 \xE0 cette interview.");
      } else {
        if (room.guest_client !== d.client) throw new ApiError(403, "Rejoignez d\u2019abord l\u2019interview.");
        if (d.action === "answer") {
          const result = await db().prepare("UPDATE afoluku_interviews.rooms SET answer=?,guest_seen=? WHERE id=? AND offer_id=? AND guest_client=?").bind(description(d.description, "answer"), now, id, d.offerId, d.client).run();
          if (!result.meta.changes) throw new ApiError(409, "La connexion a chang\xE9. Reconnectez-vous.");
        } else if (d.action === "heartbeat") await db().prepare("UPDATE afoluku_interviews.rooms SET guest_seen=? WHERE id=? AND guest_client=?").bind(now, id, d.client).run();
        else if (d.action === "leave") await db().prepare("UPDATE afoluku_interviews.rooms SET guest_client=NULL,guest_seen=0,answer=NULL WHERE id=? AND guest_client=?").bind(id, d.client).run();
        else throw new ApiError(403, "Commande r\xE9serv\xE9e \xE0 l\u2019animateur.");
      }
    }
    return json({ ok: true });
  });
}
export {
  GET,
  POST
};
