'use client';
import { useEffect, useRef, useState } from 'react';
import { Video, VideoOff } from 'lucide-react';
import { RadioCamera } from '@/lib/afoluku-radio/camera';
import { publishCamera } from '@/lib/afoluku-radio/camera-transport';
import { api } from '@/lib/afoluku-radio/audio';
export default function CameraControls({ prepareDesk, disabled }) {
 const camera=useRef(null),video=useRef(null),live=useRef(null),transport=useRef(null),mounted=useRef(false),busyRef=useRef(false);
 const [ready,setReady]=useState(false),[onAir,setOnAir]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function stop(closePreview=false){
  const session=live.current;live.current=null;transport.current?.close();transport.current=null;
  if(closePreview){camera.current?.stop();if(video.current)video.current.srcObject=null;}
  if(mounted.current){setOnAir(false);if(closePreview)setReady(false);}
  if(session)await api('/api/afoluku-radio/camera','POST',{action:'stop',session}).catch(()=>{});
 }
 useEffect(()=>{
  mounted.current=true;camera.current=new RadioCamera();
  const pulse=setInterval(()=>{const session=live.current;if(!session || !transport.current)return;void api('/api/afoluku-radio/camera','POST',{action:'pulse',session}).then(()=>{if(mounted.current)setError('');}).catch(e=>{if(live.current!==session)return;if(e.status===409){void stop();setError(e.message);}else setError('Connexion instable : reconnexion du direct caméra…');});},5000);
  const warn=e=>{if(!live.current)return;e.preventDefault();e.returnValue='';};window.addEventListener('beforeunload',warn);
  return ()=>{mounted.current=false;clearInterval(pulse);window.removeEventListener('beforeunload',warn);transport.current?.close();camera.current?.stop();if(live.current)void fetch('/api/afoluku-radio/camera',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'stop',session:live.current}),keepalive:true});};
 },[]);
 async function work(action){if(busyRef.current)return;busyRef.current=true;setBusy(true);setError('');try{await action();}catch(e){if(mounted.current)setError(e.name==='NotAllowedError'?'Autorisez l’accès à la caméra dans votre navigateur.':e.message);}finally{busyRef.current=false;if(mounted.current)setBusy(false);}}
 async function preview(){const stream=await camera.current.prepare();if(!stream||!mounted.current)return;video.current.srcObject=stream;await video.current.play();stream.getVideoTracks()[0].addEventListener('ended',()=>{if(mounted.current){void stop(true);setError('La caméra a été déconnectée.');}});setReady(true);}
 async function broadcast(){
  if(!camera.current?.stream?.active)throw new Error('Activez d’abord l’aperçu de la caméra.');
  const connection=await api('/api/afoluku-radio/camera','POST',{action:'start'});
  live.current=connection.session;
  try{
   const desk=await prepareDesk();
   if(!mounted.current){await stop(true);return;}
   transport.current=await publishCamera(connection,camera.current.stream,desk,()=>{void stop();if(mounted.current)setError('Le direct caméra a été déconnecté.');});
   if(!mounted.current){await stop(true);return;}
   await api('/api/afoluku-radio/camera','POST',{action:'pulse',session:connection.session});
   setOnAir(true);
  }catch(e){await stop();throw e;}
 }
 return <section className="radio-camera"><div className="transport"><h3><Video size={18}/>Caméra</h3>{!ready?<button className="secondary" disabled={disabled||busy} onClick={()=>void work(preview)}>Activer ma caméra</button>:<><button className={onAir?'danger':'primary'} disabled={busy||(!onAir&&disabled)} onClick={()=>void work(()=>onAir?stop():broadcast())}>{onAir?'Arrêter le direct caméra':'Passer la caméra à l’antenne'}</button><button className="secondary" disabled={busy} onClick={()=>void work(()=>stop(true))}><VideoOff size={17}/>Fermer la caméra</button></>}</div><video ref={video} muted playsInline hidden={!ready} className="camera-preview" aria-label={onAir ? "Caméra à l’antenne" : "Aperçu privé de la caméra"}/><p className="help">{onAir?'CAMÉRA À L’ANTENNE — Les auditeurs peuvent vous voir.':'Aperçu privé : vous seul voyez la caméra avant le passage à l’antenne.'} Le micro se pilote avec les commandes de prise de parole de la régie.</p>{error&&<p className="notice error" role="alert">{error}</p>}</section>;
}
