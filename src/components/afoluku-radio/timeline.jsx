"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Scissors,
  Save,
  Radio,
} from "lucide-react";
import { api } from "@/lib/afoluku-radio/audio";
import { seconds, moveEntry } from "@/lib/afoluku-radio/radio";
import {
  keptRanges,
  rangeDuration,
  timelinePlan,
} from "@/lib/afoluku-radio/timeline";
import { prepareTimelineEntry } from "@/lib/afoluku-radio/timeline-render";
import { classificationLabel } from "@/lib/afoluku-radio/track-classification";
import { Waveform } from "./track-visuals";
import { TRACK_DRAG } from "./broadcast-queue";
const DRAG = "application/x-afoluku-timeline";
const localDate = (value) =>
  value
    ? new Date(value - new Date(value).getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 19)
    : "";
const clock = (value) =>
  new Date(value).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
export default function RadioTimeline({
  tracks,
  station,
  enabled,
  disabled,
  onState,
  onRefresh,
  onMonitor,
}) {
  const [draft, setDraft] = useState(null),
    [dirty, setDirty] = useState(false),
    [selected, setSelected] = useState(null),
    [choice, setChoice] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [zoom, setZoom] = useState(1),
    [laneWidth, setLaneWidth] = useState(1000),
    [now, setNow] = useState(() => Date.now()),
    [audition, setAudition] = useState(null);
  const scroller = useRef(null),
    controller = useRef(null),
    lock = useRef(false),
    alive = useRef(true),
    drag = useRef(null),
    latest = useRef(station);
  useLayoutEffect(() => {
    latest.current = station;
  });
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      controller.current?.abort();
    };
  }, []);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    api("/api/afoluku-radio/timeline")
      .then((d) => {
        if (active) setDraft(d);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [enabled]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!dirty && !busy) return;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, busy]);
  const ready = !!draft;
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setLaneWidth(el.clientWidth));
    observer.observe(el);
    return () => observer.disconnect();
  }, [ready]);
  const locked = disabled || busy || !draft,
    entries = draft?.entries || [],
    entry = entries.find((e) => e.uid === selected),
    track = tracks.find((t) => t.id === entry?.trackId);
  const published = station.timeline;
  const displayPublished =
    !!draft &&
    !dirty &&
    published?.startedAt > 0 &&
    published.entries?.[0]?.draftVersion === draft.version;
  const origin = displayPublished
    ? published.startedAt
    : (draft?.startAt ?? now);
  let plan = [],
    problem = "";
  try {
    if (draft)
      plan = displayPublished
        ? published.entries.map((t, i) => ({
            ...entries[i],
            title: t.title,
            duration: t.duration,
            timelineStart: t.timelineStart,
            begins: origin + t.timelineStart * 1000,
            ends: origin + (t.timelineStart + t.duration) * 1000,
          }))
        : timelinePlan(entries, tracks, origin);
  } catch (e) {
    problem = e.message;
  }
  const total = plan.length ? (plan.at(-1).ends - origin) / 1000 : 0;
  const scale = (zoom * Math.max(700, laneWidth - 20)) / Math.max(60, total);
  const tickStep = Math.max(10, Math.ceil(90 / scale / 10) * 10);
  const publishedEnd = published?.entries?.at(-1);
  const onAir =
    !!published?.startedAt &&
    !!publishedEnd &&
    published.position < publishedEnd.timelineStart + publishedEnd.duration;
  const playhead = onAir && displayPublished ? published.position : null;
  const hasTransport = onAir || !!station.current;
  function change(next) {
    setDraft(next);
    setDirty(true);
    setNotice("");
  }
  function edit(patch) {
    change({
      ...draft,
      entries: entries.map((e) =>
        e.uid === selected
          ? {
              ...e,
              ...patch,
              ...(["in", "out", "cuts"].some((k) => k in patch)
                ? { rendered: null }
                : {}),
            }
          : e,
      ),
    });
    setAudition(null);
  }
  function add(id, before = entries.length) {
    const t = tracks.find((t) => t.id === id);
    if (!t || locked) return;
    if (entries.length >= 100) {
      setError("100 médias maximum.");
      return;
    }
    const item = {
      uid: crypto.randomUUID(),
      trackId: id,
      in: 0,
      out: t.duration,
      cuts: [],
      at: null,
      rendered: null,
    };
    const next = [...entries];
    next.splice(before, 0, item);
    change({ ...draft, entries: next });
    setSelected(item.uid);
    setChoice("");
  }
  async function work(fn) {
    if (lock.current || disabled) return;
    lock.current = true;
    setBusy(true);
    setError("");
    controller.current = new AbortController();
    try {
      await fn(controller.current.signal);
    } catch (e) {
      if (alive.current)
        setError(e.name === "AbortError" ? "Préparation annulée." : e.message);
    } finally {
      lock.current = false;
      if (alive.current) {
        setBusy(false);
        setNotice("");
      }
    }
  }
  async function save(value = draft) {
    const saved = await api("/api/afoluku-radio/timeline", "PUT", value);
    if (alive.current) {
      setDraft(saved);
      setDirty(false);
    }
    return saved;
  }
  async function prepare(value, signal, only) {
    let result = value;
    for (let i = 0; i < value.entries.length; i++) {
      const e = value.entries[i];
      if (only && only !== e.uid) continue;
      const t = tracks.find((t) => t.id === e.trackId);
      if (!t) throw new Error("Média supprimé.");
      setNotice(`Préparation ${i + 1}/${value.entries.length} : ${t.title}`);
      const ready = await prepareTimelineEntry(
        e.rendered && !tracks.some((t) => t.id === e.rendered.id)
          ? { ...e, rendered: null }
          : e,
        t,
        {
          signal,
          onProgress: (p) =>
            alive.current &&
            setNotice(`Découpe de ${t.title} : ${Math.round(p * 100)} %`),
        },
      );
      result = {
        ...result,
        entries: result.entries.map((item) =>
          item.uid === e.uid ? ready : item,
        ),
      };
      if (signal.aborted) throw new DOMException("Annulé", "AbortError");
      setDraft(result);
      setDirty(true);
    }
    await onRefresh();
    return result;
  }
  async function publish(signal) {
    setAudition(null);
    if (problem) throw new Error(problem);
    const basis = latest.current.revision;
    let value = await prepare(draft, signal);
    value = await save(value);
    if (signal.aborted) throw new DOMException("Annulé", "AbortError");
    const result = await api("/api/afoluku-radio/timeline", "POST", {
      version: value.version,
      revision: basis,
    });
    onState(result);
    await onMonitor(result);
  }
  async function transport(action) {
    const basis = latest.current;
    const result = await api("/api/afoluku-radio/station", "POST", {
      action,
      revision: basis.revision,
      currentKey: basis.current?.key,
    });
    onState(result);
    await onMonitor(result);
  }
  function drop(e, before) {
    if (locked) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes(DRAG)) {
      const from = drag.current;
      if (Number.isInteger(from))
        change({ ...draft, entries: moveEntry(entries, from, before) });
      drag.current = null;
    } else add(e.dataTransfer.getData(TRACK_DRAG), before);
  }
  function allow(e) {
    if (
      !locked &&
      [DRAG, TRACK_DRAG].some((type) => e.dataTransfer.types.includes(type))
    )
      e.preventDefault();
  }
  function trim(start, end) {
    edit({
      in: start,
      out: end,
      cuts: entry.cuts
        .map((c) => ({
          start: Math.max(start, c.start),
          end: Math.min(end, c.end),
        }))
        .filter((c) => c.end > c.start),
    });
  }
  return (
    <section className="radio-timeline" aria-label="Timeline de programmation">
      <header className="timeline-heading">
        <div>
          <h2>Timeline</h2>
          <p className="help">
            Préparez l’ordre, les horaires et les découpes. Les fichiers
            originaux sont conservés.
          </p>
        </div>
        <span className="badge">
          {dirty
            ? "MODIFICATIONS NON ENREGISTRÉES"
            : onAir
              ? "PROGRAMMATION À L’ANTENNE"
              : "PRÉPARATION"}
        </span>
      </header>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      {!draft ? (
        <button
          className="secondary"
          disabled={!enabled}
          onClick={() =>
            void work(async () =>
              setDraft(await api("/api/afoluku-radio/timeline")),
            )
          }
        >
          Charger la timeline
        </button>
      ) : (
        <>
          <div className="timeline-settings">
            <label>
              Nom
              <input
                value={draft.name}
                maxLength={80}
                disabled={locked}
                onChange={(e) => change({ ...draft, name: e.target.value })}
              />
            </label>
            <label>
              Départ programmé (facultatif)
              <input
                type="datetime-local"
                step="1"
                aria-label="Départ de la timeline"
                value={localDate(draft.startAt)}
                disabled={locked}
                onChange={(e) =>
                  change({
                    ...draft,
                    startAt: e.target.value
                      ? new Date(e.target.value).getTime()
                      : null,
                  })
                }
              />
            </label>
            <span className="help">
              Heures locales :{" "}
              {Intl.DateTimeFormat().resolvedOptions().timeZone}. Sans date,
              départ à la mise à l’antenne.
            </span>
          </div>
          <div className="transport timeline-transport">
            <button
              className="secondary"
              aria-label="Timeline : passage précédent"
              disabled={locked || !published?.startedAt || !!station.live}
              onClick={() => void work(() => transport("previous"))}
            >
              <SkipBack size={18} />
              Arrière
            </button>
            <button
              className="secondary"
              disabled={
                locked ||
                !!station.live ||
                (!entries.length && !hasTransport) ||
                (!!station.scheduledTimeline && !hasTransport)
              }
              onClick={() =>
                void work((signal) =>
                  hasTransport
                    ? transport(station.paused ? "resume" : "pause")
                    : publish(signal),
                )
              }
            >
              {hasTransport && !station.paused ? (
                <Pause size={18} />
              ) : (
                <Play size={18} />
              )}{" "}
              {hasTransport && !station.paused ? "Pause" : "Play"}
            </button>
            <button
              className="secondary"
              aria-label="Timeline : passage suivant"
              disabled={locked || !hasTransport || !!station.live}
              onClick={() => void work(() => transport("next"))}
            >
              <SkipForward size={18} />
              Suivant
            </button>
            <button
              className="secondary"
              disabled={locked || !dirty}
              onClick={() => void work(() => save())}
            >
              <Save size={18} />
              Enregistrer
            </button>
            <button
              className="primary"
              disabled={
                locked ||
                !entries.length ||
                !!problem ||
                !!station.live ||
                !!station.camera
              }
              onClick={() => void work(publish)}
            >
              <Radio size={18} />
              {draft.startAt
                ? "Programmer toute la timeline"
                : "Mettre toute la timeline à l’antenne"}
            </button>
            {busy && (
              <button
                className="secondary"
                onClick={() => controller.current?.abort()}
              >
                Annuler la préparation
              </button>
            )}
          </div>
          {station.scheduledTimeline && (
            <p className="notice">
              Programmée : {station.scheduledTimeline.name} ·{" "}
              {new Date(station.scheduledTimeline.startedAt).toLocaleString(
                "fr-FR",
              )}
              . L’antenne actuelle continue jusque-là.{" "}
              <button
                className="secondary"
                disabled={locked}
                onClick={() =>
                  void work(async () =>
                    onState(
                      await api("/api/afoluku-radio/timeline", "DELETE", {
                        token: station.scheduledTimeline.token,
                      }),
                    ),
                  )
                }
              >
                Annuler l’horaire
              </button>
            </p>
          )}
          {onAir && (
            <p className="help">
              À l’antenne : {station.playlistName} ·{" "}
              {station.current?.title || "En attente du prochain horaire"}.
              Pause, reprise et changements manuels décalent les heures
              suivantes.
            </p>
          )}
          <div className="timeline-add">
            <select
              aria-label="Média à ajouter à la timeline"
              value={choice}
              disabled={locked}
              onChange={(e) => setChoice(e.target.value)}
            >
              <option value="">
                Choisir une musique, un jingle, une voix off…
              </option>
              {tracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} · {classificationLabel(t)}
                </option>
              ))}
            </select>
            <button
              className="secondary"
              disabled={locked || !choice}
              onClick={() => add(choice)}
            >
              <Plus size={18} />
              Ajouter
            </button>
            <label>
              Zoom
              <input
                aria-label="Zoom de la timeline"
                type="range"
                min="0.25"
                max="4"
                step="0.25"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              />
            </label>
          </div>
          {problem && (
            <p className="notice error" role="alert">
              {problem}
            </p>
          )}
          <div
            ref={scroller}
            className="timeline-scroll"
            onDragOver={allow}
            onDrop={(e) => drop(e, entries.length)}
          >
            <div
              className="timeline-lane"
              style={{ width: Math.max(700, total * scale + 30) }}
            >
              <div className="timeline-ruler">
                {Array.from(
                  { length: Math.min(145, Math.ceil(total / tickStep) + 1) },
                  (_, i) => {
                    const step = tickStep;
                    return (
                      <span key={i} style={{ left: i * step * scale }}>
                        {clock(origin + i * step * 1000)}
                      </span>
                    );
                  },
                )}
              </div>
              {!entries.length && (
                <p className="timeline-empty">
                  Glissez vos médias depuis la bibliothèque, ou utilisez «
                  Ajouter ».
                </p>
              )}
              {plan.map((p, i) => (
                <button
                  key={p.uid}
                  disabled={busy}
                  className={`timeline-clip ${selected === p.uid ? "selected" : ""} ${displayPublished && station.current?.entryId === p.uid ? "onair" : ""}`}
                  style={{
                    left: p.timelineStart * scale,
                    width: Math.max(4, p.duration * scale),
                  }}
                  title={`${p.title} · ${clock(p.begins)} → ${clock(p.ends)}`}
                  onClick={() => {
                    setSelected(p.uid);
                    setAudition(null);
                  }}
                  draggable={!locked}
                  onDragStart={(e) => {
                    drag.current = i;
                    e.dataTransfer.setData(DRAG, p.uid);
                  }}
                  onDragEnd={() => {
                    drag.current = null;
                  }}
                  onDragOver={allow}
                  onDrop={(e) => drop(e, i)}
                >
                  <b>
                    {i + 1}. {p.title}
                  </b>
                  <span>
                    {clock(p.begins)} · {seconds(p.duration)}
                  </span>
                </button>
              ))}
              {onAir &&
                playhead !== null &&
                playhead >= 0 &&
                playhead <= total && (
                  <div
                    className="timeline-playhead"
                    style={{ left: playhead * scale }}
                  />
                )}
            </div>
          </div>
          <div className="timeline-list">
            {entries.map((e, i) => {
              const t = tracks.find((t) => t.id === e.trackId);
              return (
                <div
                  key={e.uid}
                  className={selected === e.uid ? "selected" : ""}
                >
                  <button
                    className="ghost"
                    disabled={busy}
                    onClick={() => {
                      setSelected(e.uid);
                      setAudition(null);
                    }}
                  >
                    {i + 1}. {t?.title || "Média supprimé"}{" "}
                    <span>
                      {plan[i] ? clock(plan[i].begins) : "Horaire à corriger"}
                    </span>
                  </button>
                  <button
                    className="ghost"
                    aria-label={`Monter le passage ${i + 1}`}
                    disabled={locked || i === 0}
                    onClick={() =>
                      change({
                        ...draft,
                        entries: moveEntry(entries, i, i - 1),
                      })
                    }
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <button
                    className="ghost"
                    aria-label={`Descendre le passage ${i + 1}`}
                    disabled={locked || i === entries.length - 1}
                    onClick={() =>
                      change({
                        ...draft,
                        entries: moveEntry(entries, i, i + 2),
                      })
                    }
                  >
                    <ArrowRight size={16} />
                  </button>
                  <button
                    className="ghost"
                    aria-label={`Retirer le passage ${i + 1}`}
                    disabled={locked}
                    onClick={() => {
                      change({
                        ...draft,
                        entries: entries.filter((item) => item.uid !== e.uid),
                      });
                      setAudition(null);
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
          {entry && track && (
            <div className="timeline-editor">
              <h3>
                <Scissors size={18} /> {track.title}
              </h3>
              <p className="help">
                Déplacez les curseurs pour retirer le début ou la fin. Les zones
                rouges seront supprimées ; les parties restantes seront
                raccordées.
              </p>
              <div className="timeline-wave">
                <Waveform
                  peaks={track.peaks}
                  label={`Montage de ${track.title}`}
                />
                {[
                  { start: 0, end: entry.in },
                  ...entry.cuts,
                  { start: entry.out, end: track.duration },
                ]
                  .filter((c) => c.end > c.start)
                  .map((c, i) => (
                    <span
                      key={i}
                      style={{
                        left: `${(c.start / track.duration) * 100}%`,
                        width: `${((c.end - c.start) / track.duration) * 100}%`,
                      }}
                    />
                  ))}
              </div>
              <div className="timeline-settings">
                <label>
                  Début conservé (secondes)
                  <input
                    aria-label="Début conservé"
                    type="number"
                    step="0.1"
                    min="0"
                    max={track.duration}
                    value={entry.in}
                    disabled={locked}
                    onChange={(e) => trim(Number(e.target.value), entry.out)}
                  />
                  <input
                    type="range"
                    aria-label="Rogner le début"
                    min="0"
                    max={Math.max(0, entry.out - 0.1)}
                    step="0.1"
                    value={entry.in}
                    disabled={locked}
                    onChange={(e) => trim(Number(e.target.value), entry.out)}
                  />
                </label>
                <label>
                  Fin conservée (secondes)
                  <input
                    aria-label="Fin conservée"
                    type="number"
                    step="0.1"
                    min="0"
                    max={track.duration}
                    value={entry.out}
                    disabled={locked}
                    onChange={(e) => trim(entry.in, Number(e.target.value))}
                  />
                  <input
                    type="range"
                    aria-label="Rogner la fin"
                    min={entry.in + 0.1}
                    max={track.duration}
                    step="0.1"
                    value={entry.out}
                    disabled={locked}
                    onChange={(e) => trim(entry.in, Number(e.target.value))}
                  />
                </label>
                <label>
                  Heure imposée (facultatif)
                  <input
                    aria-label="Heure du passage"
                    type="datetime-local"
                    step="1"
                    value={localDate(entry.at)}
                    disabled={locked}
                    onChange={(e) =>
                      edit({
                        at: e.target.value
                          ? new Date(e.target.value).getTime()
                          : null,
                      })
                    }
                  />
                </label>
              </div>
              {entry.cuts.map((cut, i) => (
                <div className="timeline-cut" key={i}>
                  <label>
                    Retirer de (s)
                    <input
                      aria-label={`Début de la coupe ${i + 1}`}
                      type="number"
                      min={entry.in}
                      max={entry.out}
                      step="0.1"
                      value={cut.start}
                      disabled={locked}
                      onChange={(e) =>
                        edit({
                          cuts: entry.cuts.map((c, j) =>
                            j === i
                              ? { ...c, start: Number(e.target.value) }
                              : c,
                          ),
                        })
                      }
                    />
                  </label>
                  <label>
                    à (s)
                    <input
                      aria-label={`Fin de la coupe ${i + 1}`}
                      type="number"
                      min={entry.in}
                      max={entry.out}
                      step="0.1"
                      value={cut.end}
                      disabled={locked}
                      onChange={(e) =>
                        edit({
                          cuts: entry.cuts.map((c, j) =>
                            j === i ? { ...c, end: Number(e.target.value) } : c,
                          ),
                        })
                      }
                    />
                  </label>
                  <button
                    className="ghost"
                    aria-label={`Annuler la coupe ${i + 1}`}
                    disabled={locked}
                    onClick={() =>
                      edit({ cuts: entry.cuts.filter((_, j) => j !== i) })
                    }
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
              <div className="transport">
                <button
                  className="secondary"
                  disabled={locked || entry.cuts.length >= 24}
                  onClick={() =>
                    edit({
                      cuts: [
                        ...entry.cuts,
                        {
                          start:
                            Math.round(((entry.in + entry.out) / 2) * 10) / 10,
                          end: Math.min(
                            entry.out,
                            Math.round(((entry.in + entry.out) / 2) * 10) / 10 +
                              1,
                          ),
                        },
                      ],
                    })
                  }
                >
                  <Scissors size={16} />
                  Couper une partie au milieu
                </button>
                <button
                  className="secondary"
                  disabled={locked}
                  onClick={() => edit({ in: 0, out: track.duration, cuts: [] })}
                >
                  Rétablir le morceau entier
                </button>
                <button
                  className="secondary"
                  disabled={locked || !!problem}
                  onClick={() =>
                    void work(async (signal) => {
                      const prepared = await prepare(draft, signal, entry.uid);
                      const item = prepared.entries.find(
                        (e) => e.uid === entry.uid,
                      );
                      setAudition(
                        "/api/afoluku-radio/audio/" +
                          (item.rendered?.id || item.trackId),
                      );
                    })
                  }
                >
                  <Play size={16} />
                  Préécouter le montage
                </button>
              </div>
              {audition && (
                <audio
                  key={audition}
                  src={audition}
                  controls
                  autoPlay
                  aria-label="Préécoute du montage"
                />
              )}
              <p className="help">
                {(() => {
                  try {
                    return `Durée conservée : ${seconds(rangeDuration(keptRanges(entry, track.duration)))}.`;
                  } catch {
                    return "Corrigez les limites du montage.";
                  }
                })()}{" "}
                Les intervalles vides entre deux horaires restent silencieux.
                Les chevauchements sont refusés.
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
