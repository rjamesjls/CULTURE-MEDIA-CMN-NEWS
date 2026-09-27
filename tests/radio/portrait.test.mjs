import test from 'node:test';
import assert from 'node:assert/strict';
import { validateExcerpt } from '../../src/lib/afoluku-radio/portrait-export.js';
import { defaultSettings,validSettings } from '../../src/lib/afoluku-radio/radio-settings.js';
test('portrait is opt-in and has boolean settings validation',()=>{assert.equal(defaultSettings.publicPortrait,false);assert.equal(validSettings({...defaultSettings,publicPortrait:true}),true);assert.equal(validSettings({...defaultSettings,publicPortrait:'yes'}),false);});
test('excerpt boundaries reject invalid, reversed, out-of-range and overly long clips',()=>{assert.doesNotThrow(()=>validateExcerpt(30,60,90));for(const args of [[NaN,3,10],[-1,3,10],[4,4,10],[5,4,10],[0,11,10],[0,601,800]])assert.throws(()=>validateExcerpt(...args));});
