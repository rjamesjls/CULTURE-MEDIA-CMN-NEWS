import { admin, body, check, db, handle, json } from "@/lib/afoluku-radio/server";
import { hash, ready } from "@/lib/interviews/server";
export const dynamic = "force-dynamic";
async function GET(req) {
  return handle(async () => {
    await admin(req);
    await ready();
    return json((await db().prepare("SELECT id,title,host_name,guest_name,created_at,expires_at,closed FROM afoluku_interviews.rooms ORDER BY created_at DESC LIMIT 40").all()).results);
  });
}
async function POST(req) {
  return handle(async () => {
    await admin(req);
    await ready();
    const data = await body(req);
    check(typeof data.title === "string" && data.title.trim().length > 0 && data.title.length <= 120, "Indiquez un titre (120 caract\xE8res maximum).");
    check(typeof data.hostName === "string" && data.hostName.trim() && data.hostName.length <= 60, "Indiquez votre nom (60 caract\xE8res maximum).");
    const id = crypto.randomUUID(), token = crypto.randomUUID() + crypto.randomUUID(), expires = Date.now() + 864e5;
    await db().prepare("INSERT INTO afoluku_interviews.rooms(id,title,host_name,token_hash,created_at,expires_at) VALUES(?,?,?,?,?,?)").bind(id, data.title.trim(), data.hostName.trim(), await hash(token), Date.now(), expires).run();
    return json({ id, token, expiresAt: expires }, 201);
  });
}
export {
  GET,
  POST
};
