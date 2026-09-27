import {
  admin,
  handle,
  json,
  db,
  body,
  check,
  getTracks,
  stationRow,
  state,
  ApiError,
} from "@/lib/afoluku-radio/server";
import { transaction } from "@/lib/afoluku-radio/postgres";
import {
  validateTimeline,
  timelinePlan,
  editSignature,
} from "@/lib/afoluku-radio/timeline";
export const dynamic = "force-dynamic";
async function setup() {
  await db()
    .prepare(
      "CREATE TABLE IF NOT EXISTS afoluku_radio.timeline_pending (id INTEGER PRIMARY KEY CHECK(id=1), token TEXT NOT NULL, name TEXT NOT NULL, snapshot TEXT NOT NULL, started_at BIGINT NOT NULL)",
    )
    .run();
  await db()
    .prepare(
      "CREATE TABLE IF NOT EXISTS afoluku_radio.timeline_draft (id INTEGER PRIMARY KEY CHECK(id=1), payload TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1)",
    )
    .run();
  await db()
    .prepare(
      "REVOKE ALL ON afoluku_radio.timeline_draft, afoluku_radio.timeline_pending FROM anon, authenticated",
    )
    .run();
}
async function draft() {
  return await db()
    .prepare("SELECT * FROM afoluku_radio.timeline_draft WHERE id=1")
    .first();
}
function value(row) {
  return row
    ? { ...JSON.parse(row.payload), version: row.version }
    : { name: "Ma programmation", startAt: null, entries: [], version: 0 };
}
export async function GET(req) {
  return handle(async () => {
    await admin(req);
    await setup();
    return json(value(await draft()));
  });
}
export async function PUT(req) {
  return handle(async () => {
    await admin(req);
    await setup();
    const data = await body(req);
    check(data && typeof data === "object", "Requête invalide.");
    let clean;
    try {
      clean = validateTimeline(data, await getTracks());
    } catch (e) {
      throw new ApiError(400, e.message);
    }
    check(
      Number.isInteger(data.version) && data.version >= 0,
      "Version invalide.",
    );
    const result = await db()
      .prepare(
        "INSERT INTO afoluku_radio.timeline_draft(id,payload,version) VALUES(1,?,1) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,version=afoluku_radio.timeline_draft.version+1 WHERE afoluku_radio.timeline_draft.version=? RETURNING payload,version",
      )
      .bind(JSON.stringify(clean), data.version)
      .run();
    if (!result.meta.changes)
      throw new ApiError(
        409,
        "La timeline a changé dans une autre fenêtre. Rechargez-la avant de continuer.",
      );
    return json(value(result.results[0]));
  });
}
export async function POST(req) {
  return handle(async () => {
    await admin(req);
    await setup();
    const data = await body(req);
    check(data && typeof data === "object", "Requête invalide.");
    const row = await stationRow();
    if (data.revision !== row.revision)
      throw new ApiError(
        409,
        "L’antenne a changé. Actualisez avant de lancer la timeline.",
      );
    if (row.live_session) {
      const live = await db()
        .prepare("SELECT updated_at FROM live_sessions WHERE id=?")
        .bind(row.live_session)
        .first();
      if (live && Date.now() - live.updated_at < 15000)
        throw new ApiError(
          409,
          "Terminez le direct micro avant de lancer la timeline.",
        );
    }
    const saved = await draft();
    if (!saved || saved.version !== data.version)
      throw new ApiError(
        409,
        "Enregistrez la dernière version de la timeline.",
      );
    const all = await getTracks(),
      known = new Map(all.map((t) => [t.id, t]));
    let clean, plan;
    const now = Date.now();
    try {
      clean = validateTimeline(JSON.parse(saved.payload), all);
      const start = data.now ? now : (clean.startAt ?? now);
      check(
        start >= now - 1000,
        "Cette heure de départ est passée. Choisissez une heure future ou effacez la date de départ pour diffuser maintenant.",
      );
      plan = timelinePlan(clean.entries, all, start);
    } catch (e) {
      throw new ApiError(400, e.message);
    }
    check(plan.length, "Ajoutez des médias dans la timeline.");
    const snapshot = plan.map((entry) => {
      const original = known.get(entry.trackId);
      const edited =
        entry.in !== 0 ||
        entry.out !== original.duration ||
        entry.cuts.length > 0;
      let track = original;
      if (edited) {
        check(
          entry.rendered?.signature === editSignature(entry, original.duration),
          "Préparez les découpes avant la diffusion.",
        );
        track = known.get(entry.rendered.id);
        check(
          track && Math.abs(track.duration - entry.duration) < 0.25,
          "La durée du montage ne correspond plus. Préparez-le à nouveau.",
        );
      }
      return {
        id: track.id,
        sourceId: original.id,
        title: original.title,
        duration: entry.duration,
        mime: track.mime,
        timelineStart: entry.timelineStart,
        entryId: entry.uid,
        draftVersion: saved.version,
      };
    });
    const start = data.now ? now : (clean.startAt ?? now);
    await transaction(async (client) => {
      const locked = (
        await client.query(
          "SELECT version FROM afoluku_radio.timeline_draft WHERE id=1 FOR UPDATE",
        )
      ).rows[0];
      if (locked?.version !== data.version)
        throw new ApiError(409, "La timeline a changé pendant la préparation.");
      if (start > now) {
        await client.query(
          "INSERT INTO afoluku_radio.timeline_pending(id,token,name,snapshot,started_at) VALUES(1,?,?,?,?) ON CONFLICT(id) DO UPDATE SET token=excluded.token,name=excluded.name,snapshot=excluded.snapshot,started_at=excluded.started_at",
          [crypto.randomUUID(), clean.name, JSON.stringify(snapshot), start],
        );
        const revision = await client.query(
          "INSERT INTO station(id,snapshot,playlist_name,started_at,loop,revision) VALUES(1,?,?,0,0,1) ON CONFLICT(id) DO UPDATE SET revision=station.revision+1 WHERE station.revision=?",
          ["[]", "", row.revision],
        );
        if (!revision.rowCount)
          throw new ApiError(409, "L’antenne a changé. Recommencez.");
        return;
      }
      await client.query(
        "DELETE FROM afoluku_radio.timeline_pending WHERE id=1",
      );
      const result = await client.query(
        "INSERT INTO station(id,snapshot,playlist_name,started_at,loop,revision) VALUES(1,?,?,?,0,1) ON CONFLICT(id) DO UPDATE SET snapshot=excluded.snapshot,playlist_name=excluded.playlist_name,started_at=excluded.started_at,loop=0,paused_at=0,stream_clock_shift=0,revision=station.revision+1 WHERE station.revision=?",
        [JSON.stringify(snapshot), clean.name, start, row.revision],
      );
      if (!result.rowCount)
        throw new ApiError(409, "L’antenne a changé. Recommencez.");
    });
    return json(await state());
  });
}

export async function DELETE(req) {
  return handle(async () => {
    await admin(req);
    await setup();
    const data = await body(req);
    check(data && typeof data === "object", "Requête invalide.");
    check(typeof data.token === "string", "Programmation invalide.");
    const result = await db()
      .prepare(
        "DELETE FROM afoluku_radio.timeline_pending WHERE id=1 AND token=?",
      )
      .bind(data.token)
      .run();
    if (!result.meta.changes)
      throw new ApiError(409, "La programmation a déjà changé ou démarré.");
    await db()
      .prepare("UPDATE station SET revision=revision+1 WHERE id=1")
      .run();
    return json(await state());
  });
}
