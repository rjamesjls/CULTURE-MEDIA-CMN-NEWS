"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {loadPortraitFonts} from "@/lib/afoluku-radio/brand-fonts";
import { Camera, Mic, MicOff, VideoOff, Link2, Download, Radio, Clapperboard, Square, PhoneOff, RefreshCw, Plus, Users, Monitor, User, Layers, Trash2 } from "lucide-react";
import { drawInterview, takes } from "@/lib/interviews/compositor";
const initialLook = { scene: "split", decor: true, title: "La parole, en direct.", host: "Animateur", guest: "Invit\xE9", overlay: null };
async function gather(pc) {
  if (pc.iceGatheringState === "complete") return;
  await new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      pc.removeEventListener("icegatheringstatechange", check);
      resolve();
    };
    const check = () => {
      if (pc.iceGatheringState === "complete") done();
    };
    const timer = setTimeout(done, 6e3);
    pc.addEventListener("icegatheringstatechange", check);
  });
}
const stamp = (seconds) => `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;
function InterviewStudio({guestPage=false}) {
  const [ready, setReady] = useState(false), [guest, setGuest] = useState(false), [roomId, setRoomId] = useState(""), [room, setRoom] = useState(null), [rooms, setRooms] = useState([]), [title, setTitle] = useState("Mon interview"), [name, setName] = useState(""), [consent, setConsent] = useState(false), [link, setLink] = useState(""), [error, setError] = useState(""), [notice, setNotice] = useState(""), [busy, setBusy] = useState(false), [joined, setJoined] = useState(false), [status, setStatus] = useState("Hors connexion"), [mic, setMic] = useState(true), [camera, setCamera] = useState(true), [devices, setDevices] = useState([]), [micId, setMicId] = useState(""), [camId, setCamId] = useState(""), [scene, setScene] = useState("split"), [decor, setDecor] = useState(true), [recording, setRecording] = useState(false), [elapsed, setElapsed] = useState(0), [saved, setSaved] = useState([]), [overlayName, setOverlayName] = useState("");
  const [scenes,setScenes]=useState([]),[sceneName,setSceneName]=useState("");
  const token = useRef(""), client = useRef(""), local = useRef(null), remote = useRef(null), pc = useRef(null), localVideo = useRef(null), remoteVideo = useRef(null), canvas = useRef(null), look = useRef({ ...initialLook }), recorder = useRef(null), audioCtx = useRef(null), destination = useRef(null), remoteNode = useRef(null), localNode = useRef(null), processedOffer = useRef(""), mounted = useRef(true), roomRef = useRef(null), joinedRef = useRef(false), role = useRef(false), overlayUrl = useRef(""), downloads = useRef([]);
  roomRef.current = room;
  joinedRef.current = joined;
  role.current = guest;
  look.current = { ...look.current, scene, decor, title: room?.title || title, host: room?.hostName || name || "Animateur", guest: room?.guestName || "Invit\xE9" };
  async function request(path, data) {
    const r = await fetch(path, { method: data ? "POST" : "GET", headers: { ...data ? { "Content-Type": "application/json" } : {}, ...token.current ? { Authorization: `Bearer ${token.current}` } : {} }, body: data ? JSON.stringify(data) : void 0, cache: "no-store" });
    const result = await r.json();
    if (!r.ok) throw Object.assign(new Error(result.error || "Connexion indisponible."), { status: r.status });
    return result;
  }
  async function action(action2, extra = {}) {
    return request("/api/interviews/" + roomId, { action: action2, client: client.current, ...extra });
  }
  async function work(fn) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function release() {
    pc.current?.close();
    pc.current = null;
    remote.current = null;
    if (remoteVideo.current) remoteVideo.current.srcObject = null;
    local.current?.getTracks().forEach((t) => t.stop());
    local.current = null;
    if (localVideo.current) localVideo.current.srcObject = null;
    joinedRef.current = false;
    setJoined(false);
    setStatus("Hors connexion");
    processedOffer.current = "";
  }
  function stopRecord() {
    if (recorder.current?.state === "recording") recorder.current.stop();
  }
  function download(take) {
    const url = URL.createObjectURL(take.blob);
    downloads.current.push(url);
    const a = document.createElement("a");
    a.href = url;
    a.download = take.name;
    a.click();
  }
  useEffect(() => {
    mounted.current = true;
    void loadPortraitFonts().catch(()=>{});
    const q = new URLSearchParams(location.search), id = q.get("room") || "", secret = location.hash.slice(1);
    const isGuest = guestPage;
    queueMicrotask(()=>{if(mounted.current)setGuest(isGuest);});
    token.current = secret || (isGuest ? sessionStorage.getItem("interview-token:" + id) || "" : "");
    if (secret) {
      sessionStorage.setItem("interview-token:" + id, secret);
      history.replaceState(null, "", location.pathname + location.search);
    }
    client.current = sessionStorage.getItem("interview-client") || crypto.randomUUID();
    sessionStorage.setItem("interview-client", client.current);
    queueMicrotask(()=>{if(mounted.current){setRoomId(id);setReady(true);}});
    if (!isGuest && id) queueMicrotask(()=>{if(mounted.current)setLink(sessionStorage.getItem("interview-link:" + id) || "");});

    void takes("list",undefined,"scenes").then(setScenes).catch(()=>{});
    void takes("list").then(setSaved).catch(() => setNotice("Le stockage local des enregistrements est indisponible. T\xE9l\xE9chargez vos prises apr\xE8s l\u2019enregistrement."));
    return () => {
      mounted.current = false;
      stopRecord();
      pc.current?.close();
      local.current?.getTracks().forEach((t) => t.stop());
      void audioCtx.current?.close();
      if (overlayUrl.current) URL.revokeObjectURL(overlayUrl.current);
      downloads.current.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);
  useEffect(() => {
    if (!ready || guest) return;
    void request("/api/interviews").then(setRooms).catch((e) => setError(e.message));
  }, [ready, guest]);
  useEffect(() => {
    if (!ready || !roomId) return;
    let active = true, timer;
    const poll = async () => {
      try {
        if (joinedRef.current || !role.current) await action("heartbeat");
        const r = await request("/api/interviews/" + roomId);
        if (!active) return;
        setRoom(r);
        if (joinedRef.current && local.current) {
          if (!role.current && r.guestOnline && (!pc.current || !r.offerId)) await offer(r);
          if (role.current && r.offer && r.offerId !== processedOffer.current) await answer(r);
          if (!role.current && r.answer && pc.current?.signalingState === "have-local-offer") await pc.current.setRemoteDescription(r.answer);
          if (!role.current && !r.guestOnline && pc.current) {
            pc.current.close();
            pc.current = null;
            remote.current = null;
            if (remoteVideo.current) remoteVideo.current.srcObject = null;
            setStatus("En attente de l\u2019invit\xE9");
          }
        }
      } catch (e) {
        if (active) {
          setError(e.message);
          if (e.status === 410) {
            stopRecord();
            release();
            return;
          }
        }
      } finally {
        if (active) timer = setTimeout(poll, 2e3);
      }
    };
    void poll();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [roomId, ready]);
  useEffect(() => {
    let frame = 0;
    const draw = () => {
      if (canvas.current) {
        const ctx = canvas.current.getContext("2d");
        if (ctx) drawInterview(ctx, guest ? remoteVideo.current : localVideo.current, guest ? localVideo.current : remoteVideo.current, look.current);
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [guest]);
  useEffect(() => {
    if (!recording) return;
    const started = Date.now();
    const timer = setInterval(() => setElapsed((Date.now() - started) / 1e3), 500);
    return () => clearInterval(timer);
  }, [recording]);
  useEffect(() => {
    const warn = (e) => {
      if (recorder.current?.state === "recording") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);
  async function prepare() {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("Micro et cam\xE9ra n\xE9cessitent HTTPS et un navigateur compatible.");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: micId ? { deviceId: { exact: micId }, echoCancellation: true } : true, video: camId ? { deviceId: { exact: camId }, width: { ideal: 1920 }, height: { ideal: 1080 } } : { width: { ideal: 1920 }, height: { ideal: 1080 } } });
    if (!mounted.current) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    local.current?.getTracks().forEach((t) => t.stop());
    local.current = stream;
    stream.getAudioTracks().forEach((t) => t.enabled = mic);
    stream.getVideoTracks().forEach((t) => t.enabled = camera);
    if (localVideo.current) {
      localVideo.current.srcObject = stream;
      await localVideo.current.play();
    }
    setDevices(await navigator.mediaDevices.enumerateDevices());
    stream.getTracks().forEach((t) => t.addEventListener("ended", () => setError("Un p\xE9riph\xE9rique a \xE9t\xE9 d\xE9connect\xE9. Quittez puis reconnectez votre micro et votre cam\xE9ra.")));
    setNotice("Micro et cam\xE9ra pr\xEAts.");
  }
  function makePeer(r) {
    pc.current?.close();
    const peer = pc.current = new RTCPeerConnection({ iceServers: r.iceServers });
    for (const track of local.current.getTracks()) peer.addTrack(track, local.current);
    peer.ontrack = (e) => {
      remote.current = e.streams[0];
      if (remoteVideo.current) {
        if(remoteVideo.current.srcObject!==remote.current)remoteVideo.current.srcObject = remote.current;
        void remoteVideo.current.play().catch(error => {if(error.name!=="AbortError")setNotice("Appuyez sur \xAB Activer le son invit\xE9 \xBB pour entendre votre interlocuteur.");});
      }
      if (audioCtx.current && destination.current) {
        remoteNode.current?.disconnect();
        remoteNode.current = audioCtx.current.createMediaStreamSource(remote.current);
        remoteNode.current.connect(destination.current);
      }
    };
    peer.onconnectionstatechange = () => {
      if (pc.current !== peer) return;
      setStatus(peer.connectionState === "connected" ? "Connect\xE9" : peer.connectionState === "failed" ? "Connexion impossible" : peer.connectionState === "disconnected" ? "Connexion interrompue" : "Connexion en cours");
      if (peer.connectionState === "failed") setError(r.relayConfigured ? "La connexion a \xE9chou\xE9. Utilisez Reconnecter." : "Ce r\xE9seau peut n\xE9cessiter un relais vid\xE9o TURN. R\xE9essayez sur un autre r\xE9seau ou configurez le relais.");
    };
    return peer;
  }
  async function offer(r) {
    const peer = makePeer(r);
    setStatus("Connexion en cours");
    await peer.setLocalDescription(await peer.createOffer());
    await gather(peer);
    if (peer !== pc.current) return;
    const offerId = crypto.randomUUID();
    processedOffer.current = offerId;
    await action("offer", { offerId, description: peer.localDescription?.toJSON() });
  }
  async function answer(r) {
    const peer = makePeer(r);
    await peer.setRemoteDescription(r.offer);
    await peer.setLocalDescription(await peer.createAnswer());
    await gather(peer);
    if (peer !== pc.current) return;
    await action("answer", { offerId: r.offerId, description: peer.localDescription?.toJSON() });
    processedOffer.current = r.offerId;
  }
  async function join() {
    if (guest && !consent) throw new Error("Confirmez votre accord avant de rejoindre.");
    if (!local.current) await prepare();
    if (!local.current) return;
    if (guest) await action("join", { name, consent });
    joinedRef.current = true;
    setJoined(true);
    setStatus(guest ? "Connexion en cours" : "En attente de l\u2019invit\xE9");
    setNotice("");
  }
  async function saveScene(){
    if(!sceneName.trim())throw new Error('Donnez un nom à cette scène.');
    if(scenes.length>=12)throw new Error('Vous pouvez conserver 12 scènes. Supprimez une scène pour en ajouter une.');
    const item={id:crypto.randomUUID(),name:sceneName.trim(),scene,decor,overlay:overlayUrl.current?await(await fetch(overlayUrl.current)).blob():null,created:Date.now()};
    await takes('save',item,'scenes');setScenes(list=>[item,...list]);setSceneName('');
  }
  async function applyScene(item){setScene(item.scene);setDecor(item.decor);if(item.overlay)await uploadOverlay(new File([item.overlay],item.name+'.png',{type:item.overlay.type}));else{look.current.overlay=null;setOverlayName('');if(overlayUrl.current)URL.revokeObjectURL(overlayUrl.current);overlayUrl.current='';}}
  async function renewInvite(){const r=await action('invite');const url=location.origin+'/interviews?room='+roomId+'&invite=1#'+r.token;sessionStorage.setItem('interview-link:'+roomId,url);setLink(url);setNotice('Nouveau lien créé. L’ancienne invitation est invalidée.');}
  async function create() {
    const r = await request("/api/interviews", { title, hostName: name });
    const url = location.origin + "/interviews?room=" + r.id + "&invite=1#" + r.token;
    sessionStorage.setItem("interview-link:" + r.id, url);
    location.href = "/admin/interviews/video?room=" + r.id;
  }
  async function leave() {
    stopRecord();
    if (guest) await action("leave");
    else await action("close");
    release();
    setNotice(guest ? "Vous avez quitt\xE9 l\u2019interview." : "Interview termin\xE9e. Le lien d\u2019invitation est d\xE9sactiv\xE9.");
  }
  async function startRecord() {
    if (!canvas.current || !local.current || !remote.current || status !== "Connect\xE9") throw new Error("Connectez votre invit\xE9 avant d\u2019enregistrer.");
    if (!window.MediaRecorder || !canvas.current.captureStream) throw new Error("Enregistrement non disponible dans ce navigateur. Essayez Chrome ou Edge.");
    await action("record", { recording: true });
    try {
      const context = audioCtx.current = new AudioContext();
      await context.resume();
      const dest = destination.current = context.createMediaStreamDestination();
      localNode.current = context.createMediaStreamSource(local.current);
      localNode.current.connect(dest);
      remoteNode.current = context.createMediaStreamSource(remote.current);
      remoteNode.current.connect(dest);
      const video = canvas.current.captureStream(30);
      const stream = new MediaStream([...video.getVideoTracks(), ...dest.stream.getAudioTracks()]);
      const mime = ["video/mp4;codecs=avc1.42E01E,mp4a.40.2", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"].find((t) => MediaRecorder.isTypeSupported(t));
      if (!mime) throw new Error("Format d\u2019enregistrement non pris en charge.");
      const rec = recorder.current = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6e6 });
      const chunks = [];
      let size = 0;
      const start = Date.now();
      rec.ondataavailable = (e) => {
        if (e.data.size) {
          chunks.push(e.data);
          size += e.data.size;
          if (size > 500 * 1024 * 1024 || Date.now() - start > 30 * 60 * 1e3) {
            setNotice("Limite de 30 minutes ou 500 Mo atteinte. La prise a \xE9t\xE9 arr\xEAt\xE9e pour \xEAtre sauvegard\xE9e.");
            stopRecord();
          }
        }
      };
      rec.onerror = () => {
        setError("L\u2019enregistrement a rencontr\xE9 une erreur. La partie disponible sera conserv\xE9e.");
        stopRecord();
      };
      rec.onstop = () => {
        video.getTracks().forEach((t) => t.stop());
        void context.close();
        audioCtx.current = null;
        destination.current = null;
        remoteNode.current = null;
        localNode.current = null;
        setRecording(false);
        void action("record", { recording: false }).catch(() => {
        });
        const blob = new Blob(chunks, { type: rec.mimeType });
        if (!blob.size) return;
        const take = { id: crypto.randomUUID(), name: (roomRef.current?.title || "Interview").replace(/[^\p{L}\p{N} _-]/gu, "").slice(0, 80) + "-" + (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replaceAll(":", "-") + (rec.mimeType.includes("mp4") ? ".mp4" : ".webm"), blob, created: Date.now(), duration: (Date.now() - start) / 1e3 };
        setSaved((list) => [take, ...list]);
        void takes("save", take).catch(() => setError("Sauvegarde locale impossible : t\xE9l\xE9chargez imm\xE9diatement cette prise."));
      };
      rec.start(1e3);
      setElapsed(0);
      setRecording(true);
    } catch (e) {
      await action("record", { recording: false }).catch(() => {
      });
      void audioCtx.current?.close();
      audioCtx.current = null;
      throw e;
    }
  }
  async function uploadOverlay(file) {
    if (!["image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) throw new Error("Choisissez une image PNG ou WebP de moins de 10 Mo.");
    const url = URL.createObjectURL(file);
    const image = new Image();
    try {
      image.src = url;
      await image.decode();
      if (overlayUrl.current) URL.revokeObjectURL(overlayUrl.current);
      overlayUrl.current = url;
      look.current.overlay = image;
      setOverlayName(file.name);
    } catch {
      URL.revokeObjectURL(url);
      throw new Error("Image illisible.");
    }
  }
  if(ready&&guest&&!roomId)return <div className="interview-app"><main className="iv-main"><h1>Votre invitation à une interview</h1><p>Ouvrez le lien privé envoyé par votre animateur pour rejoindre le studio.</p><Link href="/fr">Retour à AFOLUKU TV</Link></main></div>;
  return <div className="interview-app"><aside className="iv-rail"><Link className="iv-brand" href="/admin/interviews/video">AFOLUKU<span>INTERVIEW STUDIO</span></Link><nav><Link href="/admin">← Tableau de bord</Link><Link href="/admin/webradio"><Radio size={19} />Régie radio</Link><Link className="active" href="/admin/interviews/video"><Clapperboard size={19} />Interviews vidéo</Link><Link href="/fr/radio">Page d’écoute ↗</Link></nav><div className="iv-signature">A MEDIA FU WI<small>WI MEDIA, WI KULTURU, WI TOLI</small></div></aside><main className="iv-main"><header className="iv-header"><div><div className="iv-eyebrow">AFOLUKU TV / ESPACE INTERVIEW</div><h1>{guest ? "Bienvenue dans l\u2019interview" : "Le studio des conversations."}</h1><p>Deux voix. Plusieurs points de vue. Votre émission, à votre image.</p></div><span className={"iv-status " + (status === "Connect\xE9" ? "connected" : "")}>● {status}</span></header>
 {error && <div className="iv-message error" role="alert">{error}{!guest && error.includes("Connectez-vous") && <Link href="/admin/login?next=%2Fadmin%2Finterviews%2Fvideo" target="_top"> Se connecter</Link>}</div>}{notice && <div className="iv-message" role="status">{notice}</div>}
 {!roomId ? <><section className="iv-create"><div><span className="iv-eyebrow">01 / PRÉPARER</span><h2>Une nouvelle interview</h2><p>Créez votre salon, partagez son lien et accueillez votre invité. Il reste indépendant de l’antenne radio.</p></div><form onSubmit={(e) => {
    e.preventDefault();
    void work(create);
  }}><label>Titre de l’émission<input value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} required /></label><label>Votre nom à l’écran<input value={name} maxLength={60} placeholder="Votre nom" onChange={(e) => setName(e.target.value)} required /></label><button className="iv-primary" disabled={busy}><Plus size={18} />Créer une interview</button><small>Une invitation est valable 24 heures. Un animateur + un invité.</small></form></section><section className="iv-panel"><h2>Vos interviews</h2>{!rooms.length ? <p className="iv-empty">Votre première conversation commence ici.</p> : <div className="iv-rooms">{rooms.map((r) => <Link key={r.id} href={"/admin/interviews/video?room=" + r.id}><Clapperboard /><div><b>{r.title}</b><small>{r.closed || r.expires_at < Date.now() ? "Termin\xE9e" : "Salon disponible"}</small></div><span>Ouvrir ↗</span></Link>)}</div>}</section></> : <><div className="iv-toolbar"><h2>{room?.title || "Chargement de l\u2019interview\u2026"}</h2>{(recording || guest && room?.recording && room.hostOnline) && <span className="iv-rec">● ENREGISTREMENT {recording && stamp(elapsed)}</span>}{!guest && !link && <button disabled={busy||recording||room?.guestOnline} onClick={()=>void work(renewInvite)}>Créer un nouveau lien d’invitation</button>}{!guest && link && <button onClick={() => void work(async () => {
    await navigator.clipboard.writeText(link);
    setNotice("Invitation copi\xE9e. Envoyez ce lien \xE0 votre invit\xE9. Le Site doit aussi lui \xEAtre accessible.");
  })}><Link2 size={17} />Copier l’invitation</button>}</div>
 {!guest&&link&&<div className="iv-invitation"><label>Lien privé de l’invité<input readOnly value={link} onFocus={e=>e.target.select()}/></label><a className="iv-email" href={'mailto:?subject='+encodeURIComponent('Invitation — '+(room?.title||'Interview AFOLUKU TV'))+'&body='+encodeURIComponent('Bonjour, rejoignez-moi pour notre interview vidéo avec ce lien privé (valable 24 heures) :\n'+link)}>Préparer l’e-mail d’invitation ↗</a></div>}
 <div className="iv-grid"><section><div className="iv-stage"><canvas ref={canvas} width={1920} height={1080} aria-label="Rendu de l’interview" /><div className="iv-stage-label">{guest ? "VOTRE APER\xC7U" : "RENDU / ENREGISTREMENT"} · 1080p</div></div><div className="iv-media"><div><video ref={localVideo} muted playsInline autoPlay aria-label="Votre caméra" /><span>VOUS</span></div><div><video ref={remoteVideo} playsInline autoPlay aria-label="Votre interlocuteur" /><span>{guest ? "ANIMATEUR" : "INVIT\xC9"}</span></div></div><div className="iv-controls"><button aria-pressed={!mic} onClick={() => {
    local.current?.getAudioTracks().forEach((t) => t.enabled = !mic);
    setMic(!mic);
  }}>{mic ? <Mic size={18} /> : <MicOff size={18} />} {mic ? "Couper le micro" : "Activer le micro"}</button><button aria-pressed={!camera} onClick={() => {
    local.current?.getVideoTracks().forEach((t) => t.enabled = !camera);
    setCamera(!camera);
  }}>{camera ? <Camera size={18} /> : <VideoOff size={18} />} {camera ? "Couper la cam\xE9ra" : "Activer la cam\xE9ra"}</button><button onClick={() => void remoteVideo.current?.play().catch(() => setError("Impossible de d\xE9marrer le son."))}>Activer le son invité</button>{joined && <button className="iv-danger" disabled={busy} onClick={() => void work(leave)}><PhoneOff size={18} />{guest ? "Quitter" : "Terminer l\u2019interview"}</button>}</div></section>
 <aside className="iv-settings"><section className="iv-panel"><h3>Micro & caméra</h3>{guest && <><label>Votre nom<input value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder="Votre nom" /></label><label className="iv-check"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />J’accepte que cette interview puisse être enregistrée. Un indicateur rouge me préviendra.</label></>}{devices.length > 0 && <><label>Microphone<select value={micId} disabled={joined || recording} onChange={(e) => setMicId(e.target.value)}><option value="">Par défaut</option>{devices.filter((d) => d.kind === "audioinput").map((d) => <option key={d.deviceId} value={d.deviceId}>{d.label}</option>)}</select></label><label>Caméra<select value={camId} disabled={joined || recording} onChange={(e) => setCamId(e.target.value)}><option value="">Par défaut</option>{devices.filter((d) => d.kind === "videoinput").map((d) => <option key={d.deviceId} value={d.deviceId}>{d.label}</option>)}</select></label></>}{!joined ? <><button disabled={busy || !room} onClick={() => void work(prepare)}><Camera size={17} />Préparer / tester</button><button className="iv-primary" disabled={busy || !room || guest && (!name.trim() || !consent)} onClick={() => void work(join)}>{guest ? "Rejoindre l\u2019interview" : "Ouvrir le studio"}</button></> : <button disabled={busy || recording} onClick={() => void work(async () => {
    if (guest) {
      processedOffer.current = "";
      await action("join", { name, consent });
    } else if (room) await offer(room);
  })}><RefreshCw size={16} />Reconnecter</button>}<small>Utilisez un casque pour éviter l’écho.</small></section>
 {!guest && <><section className="iv-panel"><h3>Scènes</h3><div className="iv-scenes">{[["split", "\xC9cran partag\xE9", Users], ["host", "Animateur seul", Monitor], ["guest", "Invit\xE9 seul", User], ["pip", "Incrustation", Layers]].map(([id, label, Icon]) => <button key={id} className={scene === id ? "selected" : ""} aria-pressed={scene === id} onClick={() => setScene(id)}><Icon size={24} />{label}</button>)}</div><label className="iv-check"><input type="checkbox" checked={decor} onChange={(e) => setDecor(e.target.checked)} />Habillage AFOLUKU TV</label><label className="iv-upload">Ajouter un cadre PNG / WebP<input type="file" accept="image/png,image/webp" onChange={(e) => {
    const f = e.target.files?.[0];
    if (f) void work(() => uploadOverlay(f));
    e.target.value = "";
  }} /></label><small>Cadre transparent conseillé : 1920 × 1080, 10 Mo max.</small>{overlayName && <button onClick={() => {
    look.current.overlay = null;
    setOverlayName("");
    if (overlayUrl.current) URL.revokeObjectURL(overlayUrl.current);
    overlayUrl.current = "";
  }}>Retirer {overlayName}</button>}</section><section className="iv-panel"><h3>Mes scènes</h3><label>Nom de la scène<input value={sceneName} maxLength={50} placeholder="Ex. Invité avec cadre" onChange={e=>setSceneName(e.target.value)}/></label><button disabled={busy||!sceneName.trim()} onClick={()=>void work(saveScene)}>Enregistrer cette scène</button>{scenes.map(item=><div className="iv-saved-scene" key={item.id}><button onClick={()=>void work(()=>applyScene(item))}>{item.name}</button><button aria-label={'Supprimer la scène '+item.name} onClick={()=>void work(async()=>{await takes('delete',item.id,'scenes');setScenes(list=>list.filter(s=>s.id!==item.id));})}><Trash2 size={14}/></button></div>)}<small>Scènes et cadres conservés dans ce navigateur.</small></section><section className="iv-panel"><h3>Enregistrement</h3><p>La scène affichée et les deux voix. Changez de scène pendant la prise.</p><button className={recording ? "iv-danger" : "iv-primary"} disabled={busy || !recording && status !== "Connect\xE9"} onClick={() => recording ? stopRecord() : void work(startRecord)}>{recording ? <Square size={17} /> : <span>●</span>}{recording ? "Arr\xEAter et sauvegarder" : "Enregistrer l\u2019interview"}</button><small>1080p · MP4 si compatible, sinon WebM. Prises de 30 min / 500 Mo maximum. Gardez cet onglet ouvert et visible.</small></section></>}
 {room && !room.relayConfigured && <p className="iv-help">Connexion directe activée. Un relais TURN reste à configurer pour les réseaux restrictifs.</p>}</aside></div>{!guest && <p className="iv-help">Le lien privé donne uniquement accès à cette interview et expire après 24 heures. Aucun appel n’est diffusé sur la radio.</p>}</>}
 {!guest && <section className="iv-panel iv-takes"><h2>Vos enregistrements <span>{saved.length}</span></h2><p>Conservés dans ce navigateur. Téléchargez vos prises pour les archiver ou les partager.</p>{!saved.length ? <p className="iv-empty">Les prises terminées apparaîtront ici.</p> : saved.map((t) => <div className="iv-take" key={t.id}><div><b>{t.name}</b><small>{new Date(t.created).toLocaleString("fr-FR")} · {stamp(t.duration)} · {(t.blob.size / 1024 / 1024).toFixed(1)} Mo</small></div><button onClick={() => download(t)}><Download size={17} />Télécharger</button><button aria-label={"Supprimer " + t.name} onClick={() => void work(async () => {
    await takes("delete", t.id);
    setSaved((list) => list.filter((v) => v.id !== t.id));
  })}><Trash2 size={17} /></button></div>)}</section>}<footer>AFOLUKU TV · A MEDIA FU WI</footer></main></div>;
}
export {
  InterviewStudio as default
};
