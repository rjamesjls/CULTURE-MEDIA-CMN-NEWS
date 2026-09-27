import test from 'node:test';
import assert from 'node:assert/strict';
import { broadcastArtwork, defaultSettings } from '../../src/lib/afoluku-radio/radio-settings.js';
test('audio-only mode preserves an image cover and replaces animated covers with the logo',()=>{
 const settings={...defaultSettings,videoEnabled:false};
 assert.deepEqual(broadcastArtwork({coverUrl:'/cover.png',coverType:'image'},settings),{src:'/cover.png',type:'image'});
 assert.deepEqual(broadcastArtwork({coverUrl:'/cover.mp4',coverType:'video'},settings),{src:settings.logoUrl,type:'image'});
 assert.deepEqual(broadcastArtwork({},settings),{src:settings.logoUrl,type:'image'});
 assert.deepEqual(broadcastArtwork({coverUrl:'/cover.mp4',coverType:'video'},defaultSettings),{src:'/cover.mp4',type:'video'});
});
