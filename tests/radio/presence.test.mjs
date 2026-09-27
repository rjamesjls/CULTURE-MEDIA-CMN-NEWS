import test from 'node:test';
import assert from 'node:assert/strict';
import {ListenerPresence} from '../../src/lib/afoluku-radio/listener-presence.js';
test('presence sends only active heartbeats and stops immediately with a newer sequence',async t=>{
 const previous=globalThis.fetch,requests=[];globalThis.fetch=async(url,options)=>{requests.push(JSON.parse(options.body));return {ok:true}};t.after(()=>{globalThis.fetch=previous});
 const presence=new ListenerPresence(crypto.randomUUID());
 await presence.report(false,100000);assert.equal(requests.length,0);
 await presence.report(true,100001);await presence.report(true,102000);assert.equal(requests.length,1);
 await presence.report(true,115001);assert.equal(requests.length,2);
 await presence.report(false,115002);assert.equal(requests.length,3);assert.equal(requests[2].active,false);
 assert.deepEqual(requests.map(r=>r.sequence),[1,2,3]);assert.equal(new Set(requests.map(r=>r.sessionId)).size,1);
 await presence.report(false,130000);assert.equal(requests.length,3);
 await new ListenerPresence(requests[0].viewerId).report(true,140000);assert.notEqual(requests[3].sessionId,requests[0].sessionId);
});
test('failed stop retries, but a late failed heartbeat does not undo a successful stop',async t=>{
 const previous=globalThis.fetch,requests=[];let fail=false,release;
 globalThis.fetch=async(url,options)=>{requests.push(JSON.parse(options.body));return {ok:!fail}};t.after(()=>{globalThis.fetch=previous});
 const presence=new ListenerPresence(crypto.randomUUID());await presence.report(true,100000);
 fail=true;await presence.report(false,100001);fail=false;await presence.report(false,102000);assert.equal(requests.length,3);
 globalThis.fetch=()=>new Promise(resolve=>{release=resolve});const pending=presence.report(true,104000);
 globalThis.fetch=async()=>({ok:true});await presence.report(false,104001);release({ok:false});await pending;
 let unexpected=0;globalThis.fetch=async()=>{unexpected++;return {ok:true}};await presence.report(false,120000);assert.equal(unexpected,0);
});
