import { api } from './audio.js';
export async function publishCamera(connection, stream, desk, disconnected) {
 const {Room,RoomEvent,Track}=await import('livekit-client');
 const room=new Room({adaptiveStream:true,dynacast:true});
 const output=desk.context.createMediaStreamDestination();
 desk.mix.connect(output);
 let closed=false, videoTrack;
 const close=()=>{if(closed)return;closed=true;videoTrack?.stop();desk.mix.disconnect(output);output.stream.getTracks().forEach(t=>t.stop());void room.disconnect();};
 room.on(RoomEvent.Disconnected,()=>{if(!closed)disconnected();});
 try {
  await room.connect(connection.url,connection.token,{autoSubscribe:false});
  videoTrack=stream.getVideoTracks()[0].clone();
  await room.localParticipant.publishTrack(videoTrack,{source:Track.Source.Camera,simulcast:true});
  await room.localParticipant.publishTrack(output.stream.getAudioTracks()[0],{source:Track.Source.Microphone,dtx:false,red:false});
  return {close};
 } catch(e){close();throw e;}
}
export class CameraReceiver {
 closed=false; ready=false; room=null; source=null;
 constructor(context,target,video,error){Object.assign(this,{context,target,video,error});}
 async connect(session) {
  this.session=session;
  const connection=await api('/api/afoluku-radio/camera','POST',{action:'watch',session});
  const {Room,RoomEvent,Track}=await import('livekit-client');
  if(this.closed)return;
  const room=this.room=new Room({adaptiveStream:true});
  room.on(RoomEvent.TrackSubscribed,(track)=>{
   if(this.closed)return;
   if(track.kind===Track.Kind.Audio){this.source?.disconnect();this.source=this.context.createMediaStreamSource(new MediaStream([track.mediaStreamTrack]));this.source.connect(this.target);this.ready=true;}
   else if(track.kind===Track.Kind.Video && this.video){this.video.muted=true;track.attach(this.video);void this.video.play().catch(()=>this.error('Cliquez sur lecture pour afficher le direct caméra.'));}
  });
  room.on(RoomEvent.TrackUnsubscribed,track=>{if(track.kind===Track.Kind.Audio){this.ready=false;this.source?.disconnect();}else track.detach();});
  room.on(RoomEvent.Disconnected,()=>{this.ready=false;if(!this.closed)this.error('Connexion caméra interrompue. Relancez l’écoute.');});
  await room.connect(connection.url,connection.token);
  if(this.closed)void room.disconnect();
 }
 close(){this.closed=true;this.ready=false;this.source?.disconnect();void this.room?.disconnect();if(this.video){this.video.pause();this.video.srcObject=null;}}
}
