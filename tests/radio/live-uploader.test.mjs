import test from 'node:test';
import assert from 'node:assert/strict';
import {LiveUploader} from '../../src/lib/afoluku-radio/live-uploader.js';
const settle=async()=>{for(let i=0;i<40;i++)await Promise.resolve()};

test('a backlog of more than four segments keeps the direct active and sends every segment in order',async t=>{
 let release;const gate=new Promise(resolve=>release=resolve),requests=[],errors=[];
 t.mock.method(globalThis,'fetch',async url=>{requests.push(url);await gate;return {ok:true,status:200}});
 const upload=new LiveUploader('session',{fatal:e=>errors.push(e)});t.after(()=>upload.stop());
 for(let i=0;i<7;i++)assert.equal(upload.enqueue(new Uint8Array([i])),true);
 assert.equal(upload.stopped,false);assert.equal(errors.length,0);release();await settle();
 assert.deepEqual(requests,Array.from({length:7},(_,i)=>`/api/afoluku-radio/live/session/${i}`));assert.equal(upload.queue.length,0);
});

test('a temporary failure retries the same segment and recovers without closing the direct',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});const requests=[],warnings=[],fatal=[];let recovered=0;
 t.mock.method(globalThis,'fetch',async url=>{requests.push(url);return {ok:requests.length!==1,status:requests.length===1?503:200}});
 const upload=new LiveUploader('session',{warning:e=>warnings.push(e),fatal:e=>fatal.push(e),recovered:()=>recovered++});t.after(()=>upload.stop());
 upload.enqueue(new Uint8Array([1]));upload.enqueue(new Uint8Array([2]));await settle();assert.equal(upload.stopped,false);
 t.mock.timers.tick(500);await settle();assert.deepEqual(requests.map(v=>v.split('/').at(-1)),['0','0','1']);
 assert.equal(recovered,1);assert.equal(warnings.length,1);assert.equal(fatal.length,0);
});

test('manual stop aborts the outstanding request and never retries it',async t=>{
 const requests=[];let signal;
 t.mock.method(globalThis,'fetch',async(url,options)=>{requests.push(url);signal=options.signal;return new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(new Error('aborted'))))});
 const upload=new LiveUploader('session');upload.enqueue(new Uint8Array([1]));upload.enqueue(new Uint8Array([2]));upload.stop();await settle();
 assert.equal(signal.aborted,true);assert.equal(upload.queue.length,0);assert.equal(requests.length,1);assert.equal(upload.enqueue(new Uint8Array([3])),false);
});

test('long outages bound memory without ending the session',async t=>{
 let release;const gate=new Promise(resolve=>release=resolve);const warnings=[];
 t.mock.method(globalThis,'fetch',async()=>{await gate;return {ok:true,status:200}});
 const upload=new LiveUploader('session',{warning:e=>warnings.push(e)});t.after(()=>upload.stop());
 for(let i=0;i<12;i++)assert.equal(upload.enqueue(new Uint8Array([i])),true);
 assert.equal(upload.enqueue(new Uint8Array([12])),false);assert.equal(upload.stopped,false);assert.equal(upload.seq,12);assert.equal(warnings.length,1);
 release();await settle();assert.equal(upload.enqueue(new Uint8Array([13])),true);assert.equal(upload.seq,13);
});

test('a revoked authorisation ends transmission with an explicit error',async t=>{
 const errors=[];t.mock.method(globalThis,'fetch',async()=>({ok:false,status:403}));
 const upload=new LiveUploader('session',{fatal:e=>errors.push(e)});upload.enqueue(new Uint8Array([1]));await settle();
 assert.equal(upload.stopped,true);assert.match(errors[0],/autorisation/);
});
