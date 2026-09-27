import { encodeRadioMedia } from "./media-export";
import { keptRanges, editSignature, rangeDuration } from "./timeline";
import { uploadRadioFile } from "./upload";
import { analyzeWaveform } from "./track-media";
import { api, readFile } from "./audio";
export async function prepareTimelineEntry(
  entry,
  track,
  { signal, onProgress },
) {
  const signature = editSignature(entry, track.duration);
  if (entry.rendered?.signature === signature) return entry;
  const ranges = keptRanges(entry, track.duration);
  if (
    ranges.length === 1 &&
    ranges[0].start === 0 &&
    ranges[0].end === track.duration
  )
    return { ...entry, rendered: null };
  const video = track.mime.startsWith("video/");
  const output = await encodeRadioMedia({
    url: "/api/afoluku-radio/audio/" + track.id,
    format: video ? "mp4" : "mp3",
    ranges,
    signal,
    onProgress,
  });
  if (signal.aborted)
    throw new DOMException("Préparation annulée.", "AbortError");
  const file = new File(
    [output.blob],
    `${track.title}-montage.${output.extension}`,
    { type: output.blob.type },
  );
  if (file.size > 100 * 1024 * 1024)
    throw new Error("Le montage dépasse 100 Mo. Raccourcissez le passage.");
  const duration = await readFile(file, video);
  if (Math.abs(duration - rangeDuration(ranges)) > 0.25)
    throw new Error(
      "La durée obtenue ne correspond pas au montage. Réessayez.",
    );
  const result = await uploadRadioFile(file, {
    purpose: "track",
    title: `${track.title} · montage`.slice(0, 180),
    duration,
    mime: file.type,
  });
  await api(`/api/afoluku-radio/tracks/${result.id}/classification`, "PUT", {
    contentKind: track.contentKind || "music",
    musicGenre: track.contentKind === "music" ? track.musicGenre || null : null,
  });
  if (!video) {
    try {
      const peaks = await analyzeWaveform(file, duration);
      await api(`/api/afoluku-radio/tracks/${result.id}/waveform`, "PUT", { peaks });
    } catch { /* A missing preview waveform must not discard a completed audio montage. */ }
  }
  return { ...entry, rendered: { id: result.id, signature } };
}
