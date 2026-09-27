export function keptRanges(entry, duration) {
  const start = entry.in ?? 0,
    end = entry.out ?? duration,
    cuts = entry.cuts ?? [];
  if (
    !Number.isFinite(duration) ||
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start < 0 ||
    end > duration + 0.001 ||
    end - start < 0.1
  )
    throw new Error(
      "Choisissez un début et une fin valides (au moins 0,1 seconde).",
    );
  if (!Array.isArray(cuts) || cuts.length > 24)
    throw new Error("24 coupes maximum par morceau.");
  const sorted = cuts.map((c) => ({ ...c })).sort((a, b) => a.start - b.start);
  let cursor = start;
  const ranges = [];
  for (const cut of sorted) {
    if (
      !Number.isFinite(cut.start) ||
      !Number.isFinite(cut.end) ||
      cut.start < cursor ||
      cut.end <= cut.start ||
      cut.end > end
    )
      throw new Error(
        "Les coupes doivent être dans le passage conservé et ne pas se chevaucher.",
      );
    if (cut.start > cursor) ranges.push({ start: cursor, end: cut.start });
    cursor = cut.end;
  }
  if (cursor < end) ranges.push({ start: cursor, end });
  if (ranges.reduce((n, r) => n + r.end - r.start, 0) < 0.1)
    throw new Error("Conservez au moins 0,1 seconde du morceau.");
  return ranges;
}
export const rangeDuration = (ranges) =>
  ranges.reduce((n, r) => n + r.end - r.start, 0);
export const editSignature = (entry, duration) =>
  JSON.stringify([entry.trackId, keptRanges(entry, duration)]);
export function timelinePlan(entries, tracks, startAt) {
  const known = new Map(tracks.map((t) => [t.id, t]));
  let end = startAt;
  if (!Number.isFinite(startAt) || startAt <= 0)
    throw new Error("Heure de départ invalide.");
  const plan = entries.map((entry) => {
    const track = known.get(entry.trackId);
    if (!track) throw new Error("Un média de la timeline a été supprimé.");
    const duration = rangeDuration(keptRanges(entry, track.duration));
    const begins = entry.at ?? end;
    if (!Number.isFinite(begins) || begins < end - 1)
      throw new Error(
        `L’heure de « ${track.title} » chevauche le passage précédent. Déplacez son horaire ou raccourcissez le morceau précédent.`,
      );
    const gap = Math.max(0, (begins - end) / 1000);
    end = begins + duration * 1000;
    return {
      ...entry,
      title: track.title,
      duration,
      begins,
      ends: end,
      gap,
      timelineStart: (begins - startAt) / 1000,
    };
  });
  if (end - startAt > 86400000)
    throw new Error("Une timeline peut couvrir 24 heures maximum.");
  return plan;
}
export function validateTimeline(data, tracks) {
  if (
    !data ||
    typeof data.name !== "string" ||
    !data.name.trim() ||
    data.name.length > 80 ||
    !Array.isArray(data.entries) ||
    data.entries.length > 100
  )
    throw new Error("Nommez la timeline et limitez-la à 100 médias.");
  if (
    data.startAt !== null &&
    (!Number.isSafeInteger(data.startAt) || data.startAt <= 0)
  )
    throw new Error("Date de départ invalide.");
  const known = new Map(tracks.map((t) => [t.id, t])),
    seen = new Set();
  const entries = data.entries.map((entry) => {
    if (
      !entry ||
      typeof entry.uid !== "string" ||
      !/^[-a-f0-9]{36}$/.test(entry.uid) ||
      seen.has(entry.uid)
    )
      throw new Error("Identifiant de passage invalide.");
    seen.add(entry.uid);
    const track = known.get(entry.trackId);
    if (!track) throw new Error("Un média a été supprimé.");
    keptRanges(entry, track.duration);
    if (entry.at != null && (!Number.isSafeInteger(entry.at) || entry.at <= 0))
      throw new Error("Heure de passage invalide.");
    const rendered =
      entry.rendered &&
      known.has(entry.rendered.id) &&
      entry.rendered.signature === editSignature(entry, track.duration)
        ? { id: entry.rendered.id, signature: entry.rendered.signature }
        : null;
    return {
      uid: entry.uid,
      trackId: track.id,
      in: entry.in ?? 0,
      out: entry.out ?? track.duration,
      cuts: entry.cuts ?? [],
      at: entry.at ?? null,
      rendered,
    };
  });
  return { name: data.name.trim(), startAt: data.startAt, entries };
}
