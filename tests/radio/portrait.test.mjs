import test from 'node:test';
import assert from 'node:assert/strict';
import { validateExcerpt } from '../../src/lib/afoluku-radio/portrait-export.js';
import { defaultSettings,validSettings } from '../../src/lib/afoluku-radio/radio-settings.js';
test('portrait is opt-in and has boolean settings validation',()=>{assert.equal(defaultSettings.publicPortrait,false);assert.equal(validSettings({...defaultSettings,publicPortrait:true}),true);assert.equal(validSettings({...defaultSettings,publicPortrait:'yes'}),false);});
test('excerpt boundaries reject invalid, reversed, out-of-range and overly long clips',()=>{assert.doesNotThrow(()=>validateExcerpt(30,60,90));for(const args of [[NaN,3,10],[-1,3,10],[4,4,10],[5,4,10],[0,11,10],[0,601,800]])assert.throws(()=>validateExcerpt(...args));});

test('portrait export uses 1080 × 1350 and fits whole media without changing its aspect ratio',async()=>{
 const {PORTRAIT_WIDTH,PORTRAIT_HEIGHT,mediaBounds}=await import('../../src/lib/afoluku-radio/portrait.js');
 assert.equal(PORTRAIT_WIDTH,1080);assert.equal(PORTRAIT_HEIGHT,1350);
 const box={x:40,y:225,width:640,height:360};
 for(const [width,height] of [[1920,1080],[1080,1920],[1000,1000]]){
  const bounds=mediaBounds({videoWidth:width,videoHeight:height,readyState:2},box);
  assert.ok(Math.abs(bounds.width/bounds.height-width/height)<1e-9);
  assert.ok(bounds.width<=box.width&&bounds.height<=box.height);
  assert.equal(bounds.x+bounds.width/2,box.x+box.width/2);
 }
 assert.equal(mediaBounds({videoWidth:1920,videoHeight:1080,readyState:1}),null);
});
