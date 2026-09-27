import test from 'node:test';
import assert from 'node:assert/strict';
import {PlaybackClock} from '../../src/lib/afoluku-radio/playback-clock.js';
const media=()=>({currentTime:20,readyState:4,seeking:false,playbackRate:1,defaultPlaybackRate:1});
test('transient delayed responses never rewind or accelerate a playing song',()=>{
 const clock=new PlaybackClock(),audio=media();
 clock.align(audio,15,false,0);assert.equal(audio.currentTime,20);
 clock.align(audio,20,false,500);clock.align(audio,16,false,1000);
 clock.align(audio,20,false,1500);assert.equal(audio.currentTime,20);
 assert.equal(audio.playbackRate,1);
});
test('persistent drift is corrected once after confirmation, at normal speed',()=>{
 const clock=new PlaybackClock(),audio=media();
 clock.align(audio,30,false,0);clock.align(audio,31,false,2500);
 assert.equal(audio.currentTime,20);clock.align(audio,35,false,5000);
 assert.equal(audio.currentTime,35);assert.equal(audio.playbackRate,1);
 clock.align(audio,40,false,5500);assert.equal(audio.currentTime,35);
});
test('seeking and buffering cancel drift confirmation, alternating errors do not trigger a correction',()=>{
 const clock=new PlaybackClock(),audio=media();
 clock.align(audio,30,false,0);audio.readyState=2;clock.align(audio,35,false,6000);
 audio.readyState=4;clock.align(audio,30,false,7000);clock.align(audio,10,false,13000);
 clock.align(audio,30,false,19000);assert.equal(audio.currentTime,20);
 audio.seeking=true;clock.align(audio,35,false,25000);assert.equal(clock.drift,null);
});
test('explicit changes, pause and resume align immediately and restore native speed',()=>{
 const clock=new PlaybackClock(),audio=media();audio.playbackRate=1.2;audio.defaultPlaybackRate=1.2;
 clock.align(audio,90,true,0);assert.equal(audio.currentTime,90);
 assert.equal(audio.playbackRate,1);assert.equal(audio.defaultPlaybackRate,1);
 clock.align(audio,NaN,true,1000);assert.equal(audio.currentTime,90);
});
