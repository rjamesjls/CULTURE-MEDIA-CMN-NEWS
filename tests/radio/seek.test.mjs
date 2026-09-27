import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePosition, seekLocal } from '../../src/lib/afoluku-radio/seek.js';
test('precise positions accept seconds or minutes:seconds and reject malformed text',()=>{
 for(const [text,value] of [['01:30',90],['90',90],['0',0],['2:05.5',125.5]]) assert.equal(parsePosition(text),value);
 for(const text of ['', '-1','1:90','hello','90seconds','1:2']) assert.ok(Number.isNaN(parsePosition(text)));
});
test('local seeking clamps to the track and preserves pause state',()=>{
 const audio={currentTime:5,duration:90,paused:true};
 seekLocal(audio,{delta:-10});assert.equal(audio.currentTime,0);assert.equal(audio.paused,true);
 seekLocal(audio,{position:30});assert.equal(audio.currentTime,30);
 audio.paused=false;seekLocal(audio,{delta:100});assert.equal(audio.currentTime,89.95);assert.equal(audio.paused,false);
 assert.throws(()=>seekLocal({duration:NaN},{position:0}),/chargement/);
});
