import test from 'node:test';
import assert from 'node:assert/strict';
import { recordMix } from '../../src/lib/afoluku-radio/recording.js';
function fixture() {
 let connected=0,disconnected=0,stopped=0,instance;
 const output={stream:{getTracks:()=>[{stop:()=>stopped++}]}};
 const desk={context:{createMediaStreamDestination:()=>output},mix:{connect:node=>{assert.equal(node,output);connected++;},disconnect:node=>{assert.equal(node,output);disconnected++;}}};
 class Recorder {
  static isTypeSupported(type){return type.startsWith('audio/webm');}
  constructor(stream,options){assert.equal(stream,output.stream);this.mimeType=options.mimeType;this.state='inactive';instance=this;}
  start(){this.state='recording';}
  stop(){this.state='inactive';this.ondataavailable({data:new Blob(['last'])});this.onstop();}
 }
 return {desk,Recorder,get instance(){return instance;},counts:()=>[connected,disconnected,stopped]};
}
test('recording retains the final chunk and only disconnects its own output',async()=>{
 const f=fixture();let result;
 const rec=recordMix(f.desk,{complete:(blob,extension)=>result={blob,extension},error:assert.fail,limit:assert.fail},f.Recorder);
 f.instance.ondataavailable({data:new Blob(['first'])});rec.stop();rec.stop();
 assert.equal(await result.blob.text(),'firstlast');assert.equal(result.extension,'webm');assert.deepEqual(f.counts(),[1,1,1]);
});
test('unsupported recorder does not connect to or disturb the broadcast',()=>{
 const f=fixture();assert.throws(()=>recordMix(f.desk,{},null),/compatible/);assert.deepEqual(f.counts(),[0,0,0]);
});
test('failed recorder start releases the recording output',()=>{
 const f=fixture();class Failed extends f.Recorder{start(){throw Error('cannot record')}}
 assert.throws(()=>recordMix(f.desk,{},Failed),/cannot record/);assert.deepEqual(f.counts(),[1,1,1]);
});
