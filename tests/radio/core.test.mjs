import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {locate,upcoming,replaceUpcoming,moveEntry,rebaseProgramme} from '../../src/lib/afoluku-radio/radio.js';
import {wav} from '../../src/lib/afoluku-radio/audio.js';
import {samplePeaks,validPeaks,imageType,videoType,fileMime} from '../../src/lib/afoluku-radio/track-media.js';
const tracks=[{id:'a',title:'A',duration:10},{id:'b',title:'B',duration:20}];
test('station clock: sequence, exact boundaries, loop and stop',()=>{
 assert.equal(locate(tracks,1000,true,6000).id,'a');assert.equal(locate(tracks,1000,true,11000).id,'b');assert.equal(locate(tracks,1000,true,31000).id,'a');assert.equal(locate(tracks,1000,false,31000),null);assert.equal(locate(tracks,0,true,6000),null);assert.equal(locate([],1000,true,6000),null);assert.equal(locate([{...tracks[0],duration:NaN}],1000,true,6000),null);
 assert.notEqual(locate(tracks,1000,true,1001).key,locate(tracks,1000,true,31001).key);
});
test('PCM encoder emits correct standalone WAV and clamps samples',()=>{const b=wav(new Float32Array([-2,0,2]),48000);const v=new DataView(b);assert.equal(b.byteLength,50);assert.equal(v.getUint32(24,true),48000);assert.equal(v.getInt16(44,true),-32768);assert.equal(v.getInt16(46,true),0);assert.equal(v.getInt16(48,true),32767);assert.equal(v.getUint32(40,true),6);});
test('audio worklet emits consecutive 2-second mono segments without dropping samples',()=>{let Processor;const chunks=[];vm.runInNewContext(fs.readFileSync('public/afoluku-radio/pcm-worklet.js','utf8'),{AudioWorkletProcessor:class{port={postMessage:value=>chunks.push(value)}},Float32Array,sampleRate:4,registerProcessor:(_,P)=>{Processor=P}});const p=new Processor();p.process([[new Float32Array([1,1,1,1,1]),new Float32Array([0,0,0,0,0])]]);p.process([[new Float32Array([1,1,1,1,1,1,1,1,1,1,1]),new Float32Array(11)]]);assert.equal(chunks.length,2);for(const c of chunks){assert.equal(c.rate,4);assert.equal(c.samples.length,8);assert.ok([...c.samples].every(n=>n===.5));}});

test('upcoming separates the current occurrence, supports loop and offline preparation',()=>{
 const more=[...tracks,{id:'c',title:'C',duration:5}];
 assert.deepEqual(upcoming(more,1000,false,15000).map(t=>t.id),['c']);
 assert.deepEqual(upcoming(more,1000,true,15000).map(t=>t.id),['c','a']);
 assert.deepEqual(upcoming(more,0,true,15000),more);
 assert.deepEqual(upcoming(more,1000,false,40000),[]);
});
test('editing the next tracks never restarts the on-air track, including later loop cycles',()=>{
 for(const now of [5000,16500,40500,76325]){
 const current=locate(tracks,1000,true,now);
 const changed=replaceUpcoming(tracks,1000,true,now,[{id:'c',title:'C',duration:14},tracks[0]]);
 const after=locate(changed.tracks,changed.startedAt,true,now);
 assert.equal(after.key,current.key);assert.equal(after.id,current.id);assert.ok(Math.abs(after.offset-current.offset)<0.001);
 assert.deepEqual(upcoming(changed.tracks,changed.startedAt,true,now).map(t=>t.id),['c','a']);
 }
});
test('queue preserves duplicate occurrences and drag positions are deterministic',()=>{
 const values=['a','a','b','c'];assert.deepEqual(moveEntry(values,1,4),['a','b','c','a']);assert.deepEqual(moveEntry(values,3,0),['c','a','a','b']);assert.deepEqual(moveEntry(values,0,1),values);assert.deepEqual(values,['a','a','b','c']);assert.throws(()=>moveEntry(values,5,0));
 const changed=replaceUpcoming(tracks,1000,false,100000,[tracks[1]]);assert.equal(changed.startedAt,0);assert.deepEqual(changed.tracks,[tracks[1]]);
});

test('waveform measures each time bucket across channels and keeps silence flat',()=>{
 assert.deepEqual(samplePeaks([new Float32Array([0,.25,0,0]),new Float32Array([0,0,0,-.8])],2),[.25,.8]);
 assert.ok(samplePeaks([new Float32Array(1024)]).every(n=>n===0));
 const samples=new Float32Array(256);samples[255]=1;const peaks=samplePeaks([samples]);assert.equal(peaks.length,128);assert.equal(peaks[127],1);assert.equal(peaks[0],0);
 assert.equal(validPeaks(peaks),true);assert.equal(validPeaks([...peaks.slice(1),NaN]),false);assert.equal(validPeaks([-1]),false);
});
test('cover signature rejects HTML and SVG while accepting supported image signatures',()=>{
 const png=Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,0]);assert.equal(imageType(png.buffer),'image/png');
 assert.equal(imageType(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"/>').buffer),null);
 assert.equal(imageType(new TextEncoder().encode('<html>not an image</html>').buffer),null);
});

test('changing loop mode keeps a later cycle on air and finishes the queued pass',()=>{
 const now=76500;const before=locate(tracks,1000,true,now);
 const rebased=rebaseProgramme(tracks,1000,true,now);
 const after=locate(rebased.tracks,rebased.startedAt,false,now);
 assert.equal(after.key,before.key);assert.equal(after.offset,before.offset);
 assert.deepEqual(upcoming(rebased.tracks,rebased.startedAt,false,now),upcoming(tracks,1000,true,now));
 assert.equal(locate(rebased.tracks,rebased.startedAt,false,now+40000),null);
 const ended=rebaseProgramme(tracks,1000,false,90000);assert.deepEqual(ended,{tracks:[],startedAt:0});
 assert.deepEqual(rebaseProgramme(tracks,0,false,90000),{tracks,startedAt:0});
});

test('video containers and file extensions distinguish MP4 video from M4A audio',()=>{
 const mp4=new Uint8Array(32);mp4.set([0,0,0,32]);mp4.set(new TextEncoder().encode('ftypisom'),4);
 assert.equal(videoType(mp4.buffer),'video/mp4');assert.equal(videoType(new TextEncoder().encode('<html>not a video</html>').buffer),null);
 const webm=new Uint8Array(24);webm.set([0x1a,0x45,0xdf,0xa3]);webm.set(new TextEncoder().encode('webm'),12);assert.equal(videoType(webm.buffer),'video/webm');
 assert.equal(fileMime({name:'film.mp4',type:''}),'video/mp4');assert.equal(fileMime({name:'music.m4a',type:''}),'audio/mp4');assert.equal(fileMime({name:'voice.webm',type:'audio/webm'}),'audio/webm');
});
