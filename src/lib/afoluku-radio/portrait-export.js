import { drawPortrait, portraitImage, PORTRAIT_WIDTH, PORTRAIT_HEIGHT } from './portrait.js';
export function validateExcerpt(start,end,duration){
 if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end<=start||end>duration)throw new Error('Choisissez un début et une fin dans la durée du média, avec la fin après le début.');
 if(end-start>600)throw new Error('Choisissez un extrait de 10 minutes maximum.');
}
export async function exportPortrait({source,start,end,settings,canvas,signal,onProgress}){
 validateExcerpt(start,end,source.duration);
 if(!globalThis.MediaRecorder || !canvas.captureStream)throw new Error('Ce navigateur ne permet pas l’export vidéo. Essayez Chrome ou Edge.');
 const mimeType=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/mp4'].find(type=>MediaRecorder.isTypeSupported(type));
 if(!mimeType)throw new Error('Aucun format vidéo compatible sur ce navigateur.');
 const context=new AudioContext();await context.resume();
 const media=document.createElement('video');media.crossOrigin='anonymous';media.playsInline=true;media.preload='auto';
 const node=context.createMediaElementSource(media),analyser=context.createAnalyser(),output=context.createMediaStreamDestination();
 analyser.fftSize=256;node.connect(analyser);analyser.connect(output);
 const silent=context.createGain();silent.gain.value=0;analyser.connect(silent);silent.connect(context.destination);
 let recorder,stream,frame,timer,resolveRecording,rejectRecording;
 const chunks=[];
 const abort=()=>rejectRecording?.(new DOMException('Export annulé.','AbortError'));
 function waitEvent(name){return new Promise((resolve,reject)=>{const timeout=setTimeout(()=>finish(new Error('Le média met trop de temps à répondre. Réessayez.')),30000);const ready=()=>finish(),bad=()=>finish(new Error('Ce média ne peut pas être lu pour l’export.')),cancel=()=>finish(new DOMException('Export annulé.','AbortError'));function finish(error){clearTimeout(timeout);media.removeEventListener(name,ready);media.removeEventListener('error',bad);signal?.removeEventListener('abort',cancel);error?reject(error):resolve();}media.addEventListener(name,ready,{once:true});media.addEventListener('error',bad,{once:true});signal?.addEventListener('abort',cancel,{once:true});if(signal?.aborted)cancel();});}
 try{
  if(signal?.aborted)throw new DOMException('Export annulé.','AbortError');
  const metadata=waitEvent('loadedmetadata');media.src=source.url;media.load();await metadata;
  if(start>0){const seek=waitEvent('seeked');media.currentTime=start;await seek;}
  const [logo,artwork]=await Promise.all([portraitImage(settings.logoUrl),portraitImage(source.coverType==='video'?null:source.coverUrl)]);
  if(signal?.aborted)throw new DOMException('Export annulé.','AbortError');
  canvas.width=PORTRAIT_WIDTH;canvas.height=PORTRAIT_HEIGHT;const ctx=canvas.getContext('2d'),bins=new Uint8Array(analyser.frequencyBinCount);
  function draw(){analyser.getByteFrequencyData(bins);drawPortrait(ctx,{name:settings.name,title:source.title,subtitle:source.subtitle||'La web radio d’AFOLUKU TV',status:'EXTRAIT',logo,artwork,video:settings.videoEnabled!==false?media:null,frequencies:bins,position:media.currentTime,duration:source.duration});onProgress?.(Math.min(1,(media.currentTime-start)/(end-start)));frame=requestAnimationFrame(draw);}
  draw();stream=canvas.captureStream(30);stream.addTrack(output.stream.getAudioTracks()[0]);
  recorder=new MediaRecorder(stream,{mimeType,videoBitsPerSecond:3000000,audioBitsPerSecond:192000});
  const done=new Promise((resolve,reject)=>{resolveRecording=resolve;rejectRecording=reject;});
  recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
  recorder.onerror=()=>rejectRecording(new Error('L’export vidéo a échoué. Réessayez.'));
  recorder.onstop=()=>resolveRecording();
  signal?.addEventListener('abort',abort,{once:true});
  const finish=()=>{media.pause();if(recorder.state!=='inactive')recorder.stop();};
  media.onended=finish;media.onerror=()=>rejectRecording(new Error('Lecture interrompue pendant l’export.'));
  recorder.start(1000);
  // Play and recording share this independent media clock; no operation touches the on-air desk.
  void media.play().catch(rejectRecording);
  let lastTime=media.currentTime,lastProgress=Date.now();
  timer=setInterval(()=>{if(media.currentTime>=end)finish();if(media.currentTime!==lastTime){lastTime=media.currentTime;lastProgress=Date.now();}else if(Date.now()-lastProgress>30000)rejectRecording(new Error('Lecture bloquée. Réessayez avec un extrait plus court.'));},25);
  await done;
  const blob=new Blob(chunks,{type:recorder.mimeType||mimeType});if(!blob.size)throw new Error('Le fichier exporté est vide.');
  return {blob,extension:mimeType.includes('mp4')?'mp4':'webm'};
 } finally {
  signal?.removeEventListener('abort',abort);cancelAnimationFrame(frame);clearInterval(timer);
  if(recorder?.state==='recording')recorder.stop();
  media.pause();media.removeAttribute('src');media.load();stream?.getTracks().forEach(track=>track.stop());output.stream.getTracks().forEach(track=>track.stop());node.disconnect();await context.close();
 }
}
