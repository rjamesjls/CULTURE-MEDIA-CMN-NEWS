import test from 'node:test';
import assert from 'node:assert/strict';
import {StreamReporter} from '../../src/lib/afoluku-radio/stream-reporter.js';
import {locate,streamKey,replaceUpcoming} from '../../src/lib/afoluku-radio/radio.js';
test('stream reports follow actual playback, immediately stop, and change tracks without waiting',async t=>{
 const previous=globalThis.fetch,requests=[];globalThis.fetch=async(url,options)=>{requests.push(JSON.parse(options.body));return {ok:true}};t.after(()=>{globalThis.fetch=previous});
 const reporter=new StreamReporter(crypto.randomUUID()),track={id:'a',key:'a:1'};
 await reporter.report(null,100000);assert.equal(requests.length,0);
 await reporter.report(track,100001);await reporter.report(track,104000);assert.equal(requests.length,1);
 await reporter.report(track,105001);await reporter.report(null,105100);assert.equal(requests.length,3);assert.equal(requests[2].active,false);
 await reporter.report(null,120000);assert.equal(requests.length,3);
 await reporter.report({id:'b',key:'b:2'},120001);assert.equal(requests[3].trackId,'b');assert.deepEqual(requests.map(r=>r.sequence),[1,2,3,4]);
});
test('stream identity survives pause/resume and queue edits but changes on a later loop',()=>{
 const tracks=[{id:'a',title:'A',duration:60},{id:'b',title:'B',duration:40}];
 const original=locate(tracks,100000,true,115000),resumed=locate(tracks,110000,true,125000);
 assert.notEqual(original.key,resumed.key);assert.equal(streamKey(original.key,0),streamKey(resumed.key,10000));
 const edited=replaceUpcoming(tracks,110000,true,125000,[tracks[1],tracks[1]]);
 assert.equal(streamKey(locate(edited.tracks,edited.startedAt,true,125000).key,10000),streamKey(original.key,0));
 assert.notEqual(streamKey(locate(tracks,110000,true,225000).key,10000),streamKey(original.key,0));
});
