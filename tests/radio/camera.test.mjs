import test from 'node:test';
import assert from 'node:assert/strict';
import { RadioCamera } from '../../src/lib/afoluku-radio/camera.js';
test('camera preview does not request microphone and closing cancels late permissions',async()=>{
 const original=Object.getOwnPropertyDescriptor(globalThis,'navigator');
 let resolve,stopped=0,requested;
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{mediaDevices:{getUserMedia:options=>{requested=options;return new Promise(done=>{resolve=done;});}}}});
 try {
  const camera=new RadioCamera();assert.equal(requested,undefined);
  const ready=camera.prepare();camera.stop();resolve({getTracks:()=>[{stop:()=>stopped++}]});
  assert.equal(await ready,null);assert.equal(requested.audio,false);assert.equal(stopped,1);assert.equal(camera.stream,null);
 } finally {if(original)Object.defineProperty(globalThis,'navigator',original);else delete globalThis.navigator;}
});
