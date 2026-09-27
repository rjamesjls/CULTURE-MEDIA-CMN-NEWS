import test from "node:test";
import assert from "node:assert/strict";
import {
  keptRanges,
  rangeDuration,
  timelinePlan,
  validateTimeline,
} from "../../src/lib/afoluku-radio/timeline.js";
import { locate, upcoming } from "../../src/lib/afoluku-radio/radio.js";
const track = {
  id: "00000000-0000-4000-8000-000000000001",
  title: "Musique",
  duration: 100,
};
const entry = {
  uid: "00000000-0000-4000-8000-000000000002",
  trackId: track.id,
  in: 10,
  out: 90,
  cuts: [{ start: 30, end: 50 }],
  at: null,
};
test("trimming and middle removal retain ordered source intervals without modifying the source", () => {
  const snapshot = JSON.stringify(entry);
  const ranges = keptRanges(entry, 100);
  assert.deepEqual(ranges, [
    { start: 10, end: 30 },
    { start: 50, end: 90 },
  ]);
  assert.equal(rangeDuration(ranges), 60);
  assert.equal(JSON.stringify(entry), snapshot);
  for (const bad of [
    { ...entry, in: -1 },
    { ...entry, out: 101 },
    { ...entry, cuts: [{ start: 5, end: 20 }] },
    {
      ...entry,
      cuts: [
        { start: 20, end: 40 },
        { start: 30, end: 50 },
      ],
    },
    { ...entry, cuts: [{ start: 10, end: 90 }] },
  ])
    assert.throws(() => keptRanges(bad, 100));
});
test("fixed-time slots keep gaps but reject overlaps and missing files", () => {
  const start = 1800000000000;
  const plan = timelinePlan(
    [entry, { ...entry, uid: "other", at: start + 90000 }],
    [track],
    start,
  );
  assert.equal(plan[0].duration, 60);
  assert.equal(plan[1].gap, 30);
  assert.equal(plan[1].timelineStart, 90);
  assert.throws(
    () =>
      timelinePlan([entry, { ...entry, at: start + 10000 }], [track], start),
    /chevauche/,
  );
  assert.throws(() => timelinePlan([entry], [], start), /supprimé/);
});
test("scheduled playout is silent before start and in gaps, and picks the exact clip after reconnect", () => {
  const start = 1800000000000;
  const tracks = [
    { id: "a", duration: 30, timelineStart: 0 },
    { id: "b", duration: 10, timelineStart: 60 },
  ];
  assert.equal(locate(tracks, start, false, start - 1), null);
  assert.equal(locate(tracks, start, false, start + 30000), null);
  assert.deepEqual(
    upcoming(tracks, start, false, start + 40000).map((t) => t.id),
    ["b"],
  );
  assert.equal(locate(tracks, start, false, start + 65000).offset, 5);
  assert.equal(locate(tracks, start, true, start + 80000), null);
  assert.equal(upcoming(tracks, start, false, start + 80000).length, 0);
});
test("draft validation rejects duplicate identities and invalid edit references", () => {
  assert.throws(
    () =>
      validateTimeline(
        { name: "Draft", startAt: null, entries: [entry, entry] },
        [track],
      ),
    /Identifiant/,
  );
  const saved = validateTimeline(
    {
      name: " Draft ",
      startAt: null,
      entries: [
        { ...entry, rendered: { id: "missing", signature: "anything" } },
      ],
    },
    [track],
  );
  assert.equal(saved.name, "Draft");
  assert.equal(saved.entries[0].rendered, null);
});
