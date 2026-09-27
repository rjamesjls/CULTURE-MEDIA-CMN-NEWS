import { db } from "./server";
export async function activateScheduledTimeline() {
  try {
    await db()
      .prepare(
        `WITH due AS (DELETE FROM afoluku_radio.timeline_pending WHERE id=1 AND started_at<=? RETURNING *)
 INSERT INTO station(id,snapshot,playlist_name,started_at,loop,revision)
 SELECT 1,snapshot,name,started_at,0,1 FROM due
 ON CONFLICT(id) DO UPDATE SET snapshot=excluded.snapshot,playlist_name=excluded.playlist_name,started_at=excluded.started_at,loop=0,paused_at=0,stream_clock_shift=0,revision=station.revision+1`,
      )
      .bind(Date.now())
      .run();
  } catch (e) {
    if (e.code !== "42P01") throw e;
  }
}
export async function pendingTimeline() {
  try {
    return await db()
      .prepare(
        'SELECT token,name,started_at AS "startedAt" FROM afoluku_radio.timeline_pending WHERE id=1',
      )
      .first();
  } catch (e) {
    if (e.code === "42P01") return null;
    throw e;
  }
}
export async function cancelScheduledTimeline() {
  try {
    await db()
      .prepare("DELETE FROM afoluku_radio.timeline_pending WHERE id=1")
      .run();
  } catch (e) {
    if (e.code !== "42P01") throw e;
  }
}

export async function scheduledTrackReference(id) {
  try {
    const row = await db()
      .prepare("SELECT snapshot FROM afoluku_radio.timeline_pending WHERE id=1")
      .first();
    return row
      ? JSON.parse(row.snapshot).some((t) => t.id === id || t.sourceId === id)
      : false;
  } catch (e) {
    if (e.code === "42P01") return false;
    throw e;
  }
}
