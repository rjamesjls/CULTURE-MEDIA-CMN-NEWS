import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { postgres, identity } from "./runtime.mjs";
import "./register.mjs";
process.env.RADIO_DATABASE_URL = "postgresql://local-test-only";
await postgres.exec(
  "CREATE ROLE anon;CREATE ROLE authenticated;CREATE SCHEMA storage;CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);",
);
await postgres.exec(
  await readFile(
    new URL(
      "../../supabase/migrations/20260927120000_afoluku_radio.sql",
      import.meta.url,
    ),
    "utf8",
  ),
);
const timeline = await import(
    "../../src/app/api/afoluku-radio/timeline/route.js"
  ),
  station = await import("../../src/app/api/afoluku-radio/station/route.js"),
  tracksRoute = await import("../../src/app/api/afoluku-radio/tracks/route.js");
const { db } = await import("../../src/lib/afoluku-radio/server.js");
const req = (method, data, origin = "https://afolukutv.test") =>
  new Request("https://afolukutv.test/api/afoluku-radio/timeline", {
    method,
    headers: { "Content-Type": "application/json", Origin: origin },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
const call = async (route, method, data) => {
  const r = await route[method](req(method, data));
  return { status: r.status, data: await r.json() };
};
let now = 1800000000000;
const actualNow = Date.now;
Date.now = () => now;
try {
  identity.user = null;
  assert.equal((await call(timeline, "GET")).status, 401);
  identity.user = { id: "00000000-0000-4000-8000-000000000001" };
  identity.profile = { role: "admin", status: "active" };
  assert.equal(
    (await timeline.PUT(req("PUT", {}, "https://evil.test"))).status,
    403,
  );
  const a = crypto.randomUUID(),
    b = crypto.randomUUID();
  for (const id of [a, b])
    await db()
      .prepare(
        "INSERT INTO tracks(id,title,duration,bytes,mime,created_at,content_kind) VALUES(?,?,?,100,?,?,?)",
      )
      .bind(
        id,
        id === a ? "Song" : "Jingle",
        id === a ? 60 : 10,
        "audio/mpeg",
        now,
        id === a ? "music" : "jingle",
      )
      .run();
  let draft = (await call(timeline, "GET")).data;
  const entries = [
    {
      uid: crypto.randomUUID(),
      trackId: a,
      in: 0,
      out: 60,
      cuts: [],
      at: null,
    },
    {
      uid: crypto.randomUUID(),
      trackId: b,
      in: 0,
      out: 10,
      cuts: [],
      at: now + 90000,
    },
  ];
  let r = await call(timeline, "PUT", { ...draft, entries });
  assert.equal(r.status, 200, JSON.stringify(r));
  draft = r.data;
  assert.equal(
    (await call(timeline, "PUT", { ...draft, version: 0 })).status,
    409,
  );
  r = await call(timeline, "POST", { version: draft.version, revision: 0 });
  assert.equal(r.status, 200, JSON.stringify(r));
  let state = r.data;
  assert.equal(state.current.id, a);
  assert.equal(state.loop, false);
  now += 65000;
  state = (await call(station, "GET")).data;
  assert.equal(state.current, null);
  assert.equal(state.upcoming[0].id, b);
  state = (
    await call(station, "POST", { action: "pause", revision: state.revision })
  ).data;
  assert.equal(state.paused, true);
  now += 5000;
  state = (
    await call(station, "POST", { action: "resume", revision: state.revision })
  ).data;
  now += 30000;
  state = (await call(station, "GET")).data;
  assert.equal(state.current.id, b);
  assert.equal(state.current.contentKind, "jingle");
  state = (
    await call(station, "POST", {
      action: "previous",
      revision: state.revision,
    })
  ).data;
  assert.equal(state.current.id, a);
  assert.equal(state.current.offset, 0);
  assert.equal(
    (
      await call(station, "POST", {
        action: "next",
        revision: state.revision - 1,
      })
    ).status,
    409,
  );
  const before = state.current.key;
  const future = now + 120000;
  draft = (
    await call(timeline, "PUT", {
      ...draft,
      startAt: future,
      entries: entries.map((e) => ({ ...e, at: null })),
    })
  ).data;
  r = await call(timeline, "POST", {
    version: draft.version,
    revision: state.revision,
  });
  assert.equal(r.status, 200, JSON.stringify(r));
  state = r.data;
  assert.equal(state.current.key, before);
  assert.equal(state.scheduledTimeline.startedAt, future);
  assert.equal((await call(tracksRoute, "DELETE", { id: a })).status, 409);
  now = future + 3000;
  state = (await call(station, "GET")).data;
  assert.equal(state.current.id, a);
  assert.equal(state.current.offset, 3);
  assert.equal(state.scheduledTimeline, null);
  const revision = state.revision;
  assert.equal((await call(station, "GET")).data.revision, revision);
  draft = (await call(timeline, "PUT", { ...draft, startAt: now + 120000 }))
    .data;
  state = (
    await call(timeline, "POST", {
      version: draft.version,
      revision: state.revision,
    })
  ).data;
  assert.equal(
    (await call(timeline, "DELETE", { token: "stale" })).status,
    409,
  );
  state = (
    await call(timeline, "DELETE", { token: state.scheduledTimeline.token })
  ).data;
  assert.equal(state.scheduledTimeline, null);
  draft = (
    await call(timeline, "PUT", {
      ...draft,
      startAt: null,
      entries: [
        { ...entries[0], in: 10, out: 50, cuts: [{ start: 20, end: 30 }] },
      ],
    })
  ).data;
  r = await call(timeline, "POST", {
    version: draft.version,
    revision: state.revision,
  });
  assert.equal(r.status, 400);
  assert.match(r.data.error, /découpes/);
  const rendered = crypto.randomUUID();
  await db()
    .prepare(
      "INSERT INTO tracks(id,title,duration,bytes,mime,created_at,content_kind) VALUES(?,?,40,100,?,?,?)",
    )
    .bind(rendered, "Montage", "audio/mpeg", now, "music")
    .run();
  const { editSignature } = await import(
    "../../src/lib/afoluku-radio/timeline.js"
  );
  const edit = {
    ...entries[0],
    in: 10,
    out: 60,
    cuts: [{ start: 20, end: 30 }],
  };
  edit.rendered = { id: rendered, signature: editSignature(edit, 60) };
  draft = (await call(timeline, "PUT", { ...draft, entries: [edit] })).data;
  state = (
    await call(timeline, "POST", {
      version: draft.version,
      revision: state.revision,
    })
  ).data;
  assert.equal(state.current.id, rendered);
  assert.equal(state.current.title, "Song");
  assert.equal(state.current.duration, 40);
  assert.equal(state.current.streamTrackId, a);
  assert.ok(state.current.streamKey.startsWith(a + ":"));
  const streams = await import(
    "../../src/app/api/afoluku-radio/streams/route.js"
  );
  const viewerId = crypto.randomUUID(),
    sessionId = crypto.randomUUID();
  let sequence = 0;
  for (let i = 0; i < 4; i++) {
    const counted = await call(streams, "POST", {
      viewerId,
      sessionId,
      sequence: ++sequence,
      trackId: a,
      occurrence: state.current.streamKey,
      active: true,
    });
    assert.equal(counted.status, 200);
    if (i < 3) now += 10000;
  }
  const stats = (await call(streams, "GET")).data;
  assert.equal(stats.tracks.find((t) => t.id === a)?.streams, 1);
  assert.equal(
    stats.tracks.some((t) => t.id === rendered),
    false,
  );
  console.log(
    "PASS timeline API: authorization, CAS, scheduled activation, gaps, pause/resume, previous, cancellation, source protection, mandatory rendered cuts.",
  );
} finally {
  Date.now = actualNow;
  await postgres.close();
}
