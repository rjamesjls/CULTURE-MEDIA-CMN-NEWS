import test from 'node:test';
import assert from 'node:assert/strict';
import {ListenerAudio,AudioDesk} from '../../src/lib/afoluku-radio/audio.js';

function deferred(){let resolve;const promise=new Promise(r=>{resolve=r});return {promise,resolve};}
function setup(t){
 const previous={Audio:globalThis.Audio,AudioContext:globalThis.AudioContext,fetch:globalThis.fetch};
 const scheduled=[];const requests=[];
 const node=()=>({connections:[],connect(target){this.connections.push(target);},disconnect(){},gain:{value:1,events:[],cancelScheduledValues(time){this.events=this.events.filter(e=>e.time<time)},setValueAtTime(value,time){this.value=value;this.events.push({value,time})}}});
 class Context{
  currentTime=10;state='running';destination=node();
  resume=()=>Promise.resolve();
  close=()=>Promise.resolve();
  createGain=node;createMediaElementSource=node;createAnalyser=node;
  decodeAudioData=async()=>({duration:1});
  createBufferSource(){const source={...node(),start(time){scheduled.push({source,time});},stop(){source.stopped=true;}};return source;}
 }
 globalThis.AudioContext=Context;
 globalThis.Audio=class{
  paused=true;ended=false;readyState=4;currentTime=0;plays=0;src='';
  addEventListener(){}
  getAttribute(name){return this[name]||null;}
  removeAttribute(name){this[name]='';}
  load(){}
  play(){this.paused=false;this.plays++;return Promise.resolve();}
  pause(){this.paused=true;}
 };
 globalThis.fetch=async url=>{requests.push(url);return {ok:true,arrayBuffer:async()=>new ArrayBuffer(44)};};
 t.after(()=>Object.assign(globalThis,previous));
 const video=new globalThis.Audio();return {player:new ListenerAudio(video),video,scheduled,requests};
}
const state=(time=1)=>({serverNow:time,active:true,current:{id:'track',key:'track:1',offset:2},live:null});
const live=(seq,time=1)=>({...state(time),live:{session:'live-a',seq,updatedAt:time}});

test('pause cancels playback waiting for audio activation',async t=>{
 const {player}=setup(t);const gate=deferred();player.context.resume=()=>gate.promise;
 const pending=player.sync(state());player.stop();gate.resolve();await pending;
 assert.equal(player.audio.plays,0);assert.equal(player.audio.paused,true);
});
test('concurrent live updates schedule each segment only once, starting at the latest',async t=>{
 const {player,scheduled,requests}=setup(t);const gate=deferred();player.context.decodeAudioData=()=>gate.promise;
 const first=player.sync(live(12));const second=player.sync(live(12,2));
 gate.resolve({duration:1});await Promise.all([first,second]);
 assert.deepEqual(requests,['/api/afoluku-radio/live/live-a/11','/api/afoluku-radio/live/live-a/12']);assert.equal(scheduled.length,2);assert.equal(scheduled[0].time,11.2);
 await player.sync(live(13,3));assert.equal(scheduled.length,3);assert.equal(scheduled[2].time,13.2);
});
test('pause during a download cannot schedule a late live segment',async t=>{
 const {player,scheduled}=setup(t);const gate=deferred(),requested=deferred();
 globalThis.fetch=()=>{requested.resolve();return gate.promise;};
 const pending=player.sync(live(3));await requested.promise;player.stop();
 gate.resolve({ok:true,arrayBuffer:async()=>new ArrayBuffer(44)});await pending;
 assert.equal(scheduled.length,0);assert.equal(player.session,'');
});
test('a listener that falls behind returns to the newest segment instead of replaying old speech',async t=>{
 const {player,scheduled,requests}=setup(t);
 await player.sync(live(1));await player.sync(live(20,2));
 assert.deepEqual(requests,['/api/afoluku-radio/live/live-a/0','/api/afoluku-radio/live/live-a/1','/api/afoluku-radio/live/live-a/19','/api/afoluku-radio/live/live-a/20']);assert.equal(scheduled[0].source.stopped,true);
});
test('late station responses cannot replace newer playback, and pause can be resumed',async t=>{
 const {player}=setup(t);await player.sync(state(5));
 await player.sync({...state(4),current:{id:'old',key:'old',offset:0}});
 assert.equal(player.audio.src,'/api/afoluku-radio/audio/track');player.stop();await player.sync(state(6));assert.equal(player.audio.paused,false);
});

test('mixed audio/video programme uses the displayed video, seeks to the live position, and silences the previous media',async t=>{
 const {player,video}=setup(t);
 await player.sync(state(1));const audio=player.audio;assert.notEqual(audio,video);
 await player.sync({...state(2),current:{id:'clip',key:'clip:1',offset:17,mime:'video/mp4'}});
 assert.equal(player.audio,video);assert.equal(video.crossOrigin,'anonymous');assert.equal(audio.crossOrigin,'anonymous');assert.equal(video.currentTime,17);assert.equal(video.src,'/api/afoluku-radio/audio/clip');assert.equal(audio.paused,true);assert.equal(video.paused,false);
 await player.sync({...state(3),current:{id:'clip',key:'clip:1',offset:18,mime:'video/mp4'}});assert.equal(video.plays,1);
 await player.sync(state(4));assert.equal(player.audio,audio);assert.equal(video.paused,true);assert.equal(audio.paused,false);
 player.stop();assert.equal(audio.paused,true);assert.equal(video.paused,true);
});
test('microphone live mutes the loaded programme and returns without reloading it',async t=>{
 const {player,video}=setup(t);
 await player.sync({...state(1),current:{id:'clip',key:'clip:1',offset:3,mime:'video/webm'}});
 await player.sync(live(0,2));assert.equal(video.paused,false);assert.equal(player.programmeGain.gain.value,0);
 await player.sync({...state(3),current:{id:'clip',key:'clip:1',offset:12,mime:'video/webm'}});
 assert.equal(video.currentTime,12);assert.equal(video.paused,false);assert.equal(player.session,'');
});

test('studio previews keep playing with a muted monitor and the spectrum has a silent output',async t=>{
 const {video}=setup(t);const desk=new AudioDesk(video);desk.monitor.gain.value=0;
 await desk.sync({...state(),current:{id:'clip',key:'clip:1',offset:3,mime:'video/mp4'}});
 assert.equal(video.paused,false);assert.equal(desk.monitor.gain.value,0);
 assert.ok(desk.mix.connections.includes(desk.spectrum));assert.ok(desk.spectrum.connections.includes(desk.silent));
 assert.ok(desk.silent.connections.includes(desk.context.destination));assert.equal(desk.silent.gain.value,0);
 await desk.sync({...state(2),current:{id:'clip',key:'clip:1',offset:4,mime:'video/mp4'}});assert.equal(video.plays,1);
 desk.destroy();
});
test('listener presence excludes idle, paused, stalled and suspended playback',async t=>{
 const {player}=setup(t);assert.equal(player.isPlaying(),false);await player.sync(state());assert.equal(player.isPlaying(),true);
 player.audio.readyState=2;assert.equal(player.isPlaying(),false);player.audio.readyState=4;
 player.context.state='suspended';assert.equal(player.isPlaying(),false);player.context.state='running';
 player.stop();assert.equal(player.isPlaying(),false);
 await player.sync(live(0,2));assert.equal(player.isPlaying(),true);player.context.currentTime=20;assert.equal(player.isPlaying(),false);
 player.destroy();assert.equal(player.isPlaying(),false);
});

test('broadcast pause freezes audio and video and resumes at the supplied offset',async t=>{
 const {player,video}=setup(t);await player.sync({...state(1),current:{id:'clip',key:'clip:1',offset:7,mime:'video/mp4'}});
 await player.sync({...state(2),paused:true,current:{id:'clip',key:'clip:1',offset:7.5,mime:'video/mp4'}});assert.equal(video.paused,true);assert.equal(video.currentTime,7.5);assert.equal(player.isPlaying(),false);
 await player.sync({...state(3),paused:true,current:{id:'clip',key:'clip:1',offset:7.5,mime:'video/mp4'}});assert.equal(video.plays,1);
 await player.sync({...state(4),paused:false,current:{id:'clip',key:'clip:2',offset:7.5,mime:'video/mp4'}});assert.equal(video.paused,false);assert.equal(video.currentTime,7.5);
 await player.sync({...state(5),paused:true});assert.equal(player.audio.paused,true);
 await player.sync({...live(0,6),paused:true});assert.equal(player.isPlaying(),true);
});
test('studio return sound can be enabled independently and talking ducks music only while held',async t=>{
 const {video}=setup(t);const desk=new AudioDesk(video);const track={enabled:false};desk.stream={getAudioTracks:()=>[track],getTracks:()=>[]};
 await desk.setMonitor(.7);assert.equal(desk.monitor.gain.value,.7);assert.ok(desk.music.connections.includes(desk.monitor));assert.ok(desk.monitor.connections.includes(desk.context.destination));
 desk.setTalking(true);assert.equal(desk.music.gain.value,.22);assert.equal(desk.micGain.gain.value,1);assert.equal(track.enabled,true);
 desk.setTalking(false);assert.equal(desk.music.gain.value,1);assert.equal(desk.micGain.gain.value,0);assert.equal(track.enabled,false);assert.equal(desk.monitor.gain.value,.7);
 await desk.sync({...state(),paused:true});assert.equal(desk.audio.paused,true);await desk.sync({...state(2),paused:false});assert.equal(desk.audio.paused,false);
 await desk.setMonitor(0);assert.equal(desk.monitor.gain.value,0);assert.equal(desk.audio.paused,false);
 desk.destroy();
});

test('a late studio poll cannot resume music after the broadcast was paused',async t=>{
 setup(t);const desk=new AudioDesk();await desk.sync(state(1));await desk.sync({...state(3),paused:true});await desk.sync(state(2));assert.equal(desk.audio.paused,true);desk.destroy();
});

test('independent preview cannot replace, pause or enter the on-air mix',async t=>{
 setup(t);const programme=new AudioDesk(new Audio()),preview=new AudioDesk(new Audio());
 await programme.sync({...state(),current:{id:'on-air',key:'on-air:1',offset:10,mime:'video/mp4'}});
 await preview.preview('local-clip','video/mp4');assert.equal(programme.audio.src,'/api/afoluku-radio/audio/on-air');assert.equal(preview.audio.src,'/api/afoluku-radio/audio/local-clip');assert.equal(programme.audio.paused,false);
 assert.notEqual(programme.context,preview.context);assert.ok(!preview.music.connections.includes(programme.mix));assert.ok(!preview.mix.connections.includes(programme.mix));
 programme.setDuckLevel(.12);programme.setTalking(true);assert.equal(programme.music.gain.value,.12);assert.equal(preview.music.gain.value,1);
 programme.setDuckLevel(.35);assert.equal(programme.music.gain.value,.35);programme.setTalking(false);assert.equal(programme.music.gain.value,1);
 preview.stopPreview();assert.equal(preview.audio.paused,true);assert.equal(programme.audio.paused,false);assert.equal(programme.audio.currentTime,10);
 await preview.preview('local-audio','audio/wav');await programme.sync({...state(2),paused:true});assert.equal(preview.audio.paused,false);assert.equal(programme.audio.paused,true);
 programme.destroy();preview.destroy();
});
test('stopping a preview during activation prevents a delayed sound',async t=>{
 setup(t);const desk=new AudioDesk();const gate=deferred();desk.context.resume=()=>gate.promise;
 const pending=desk.preview('preview-a');desk.stopPreview();gate.resolve();await pending;assert.equal(desk.audio.plays,0);assert.equal(desk.audio.paused,true);desk.destroy();
});

test('music is not paused while the first live segment is downloading',async t=>{
 const {player}=setup(t);await player.sync(state());const gate=deferred(),requested=deferred();
 globalThis.fetch=()=>{requested.resolve();return gate.promise};
 const pending=player.sync(live(0,2));await requested.promise;
 assert.equal(player.audio.paused,false);assert.equal(player.programmeGain.gain.value,1);assert.equal(player.key,'track:1');
 gate.resolve({ok:true,arrayBuffer:async()=>new ArrayBuffer(44)});await pending;
 assert.deepEqual(player.programmeGain.gain.events.at(-1),{value:0,time:11.2});
 const src=player.audio.src;await player.sync(state(3));assert.equal(player.audio.src,src);assert.equal(player.audio.plays,1);assert.equal(player.programmeGain.gain.value,1);
});

test('a five-segment delay downloads all missing speech in parallel without discarding it',async t=>{
 const {player,requests,scheduled}=setup(t);await player.sync(live(0));const gate=deferred();
 globalThis.fetch=async url=>{requests.push(url);await gate.promise;return {ok:true,arrayBuffer:async()=>new ArrayBuffer(44)}};
 const pending=player.sync(live(5,2));for(let i=0;i<5;i++)await Promise.resolve();
 assert.equal(requests.length,6);gate.resolve();await pending;
 assert.equal(scheduled.length,6);assert.equal(scheduled[0].source.stopped,undefined);
 for(let i=1;i<scheduled.length;i++)assert.ok(Math.abs(scheduled[i].time-scheduled[i-1].time-1)<.0001);
 assert.deepEqual(player.programmeGain.gain.events.at(-1),{value:0,time:11.2});
});

test('returning from live waits for the next programme file to play',async t=>{
 const {player,scheduled}=setup(t);await player.sync(live(0));const gate=deferred();
 player.audio.play=()=>gate.promise.then(()=>{player.audio.paused=false});
 const pending=player.sync(state(2));for(let i=0;i<5;i++)await Promise.resolve();
 assert.equal(scheduled[0].source.stopped,undefined);assert.equal(player.programmeGain.gain.value,0);
 gate.resolve();await pending;assert.equal(scheduled[0].source.stopped,true);assert.equal(player.programmeGain.gain.value,1);
});

test('studio and listener ignore transient timing jitter but honour an explicit seek',async t=>{
 const {player,video}=setup(t);const desk=new AudioDesk(video);
 for(const target of [player,desk]){
  await target.sync(state(100));target.audio.currentTime=20;
  await target.sync({...state(101),current:{id:'track',key:'track:1',offset:15}});
  assert.equal(target.audio.currentTime,20);assert.equal(target.audio.playbackRate,1);
  await target.sync({...state(102),current:{id:'track',key:'track:1',offset:20}});
  assert.equal(target.audio.currentTime,20);
  await target.sync({...state(103),current:{id:'track',key:'track:seek',offset:90}});
  assert.equal(target.audio.currentTime,90);assert.equal(target.audio.playbackRate,1);
 }
});
