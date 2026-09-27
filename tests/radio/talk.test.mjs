import test from 'node:test';
import assert from 'node:assert/strict';
import {HoldToTalk} from '../../src/lib/afoluku-radio/hold-to-talk.js';
const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r});return {promise,resolve}};
const settle=async()=>{for(let i=0;i<12;i++)await Promise.resolve()};
function setup(t,start=async()=>{},stop=async()=>{}){
 t.mock.timers.enable({apis:['setTimeout']});const gates=[],statuses=[];let starts=0,stops=0;
 const talk=new HoldToTalk({start:async()=>{starts++;await start()},stop:async()=>{stops++;await stop()},gate:value=>gates.push(value),change:value=>statuses.push(value),error:()=>{}});
 t.after(()=>talk.dispose());return {talk,gates,statuses,get starts(){return starts},get stops(){return stops}};
}
test('release before connection completes never opens the microphone',async t=>{
 const gate=deferred(),s=setup(t,()=>gate.promise);s.talk.press();s.talk.release();gate.resolve();await settle();assert.ok(s.gates.every(value=>value===false));
 t.mock.timers.tick(6000);await settle();assert.equal(s.stops,1);assert.equal(s.statuses.at(-1),'idle');
});
test('release mutes immediately; another press reuses the draining session',async t=>{
 const s=setup(t);s.talk.press();await settle();assert.equal(s.gates.at(-1),true);
 s.talk.release();assert.equal(s.gates.at(-1),false);t.mock.timers.tick(2000);assert.equal(s.stops,0);
 s.talk.press();assert.equal(s.gates.at(-1),true);t.mock.timers.tick(6000);assert.equal(s.stops,0);assert.equal(s.starts,1);
 s.talk.release();t.mock.timers.tick(6000);await settle();assert.equal(s.stops,1);
});
test('a press during teardown waits for it before opening a new session',async t=>{
 const gate=deferred(),s=setup(t,async()=>{},()=>gate.promise);s.talk.press();await settle();s.talk.release();t.mock.timers.tick(6000);await settle();
 s.talk.press();assert.equal(s.gates.at(-1),false);assert.equal(s.starts,1);gate.resolve();await settle();assert.equal(s.starts,2);assert.equal(s.gates.at(-1),true);
});
test('unmount during startup and repeated release cannot leave the microphone open',async t=>{
 const gate=deferred(),s=setup(t,()=>gate.promise);s.talk.press();s.talk.dispose();gate.resolve();await settle();assert.ok(s.gates.every(v=>v===false));assert.equal(s.stops,1);s.talk.press();assert.equal(s.starts,1);
});
test('idle release does not mute a separate continuous live session',async t=>{
 const s=setup(t);s.talk.release();s.talk.dispose();assert.equal(s.gates.length,0);
});
