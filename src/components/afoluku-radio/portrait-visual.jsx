'use client';
import { useEffect, useRef } from 'react';
import { drawPortrait, portraitImage, PORTRAIT_WIDTH, PORTRAIT_HEIGHT } from '@/lib/afoluku-radio/portrait';
export default function PortraitVisual({settings,station,getAnalyser,readPosition,readVideo}) {
 const canvas=useRef(null),latest=useRef(null);
 const coverUrl=station?.current?.coverUrl, coverType=station?.current?.coverType;
 useEffect(()=>{latest.current={settings,station,getAnalyser,readPosition,readVideo};});
 useEffect(()=>{
  let cancelled=false,frame,logo=null,artwork=null;
  void portraitImage(settings.logoUrl).then(img=>{if(!cancelled)logo=img;});
  void portraitImage(coverType==='video'?null:coverUrl).then(img=>{if(!cancelled)artwork=img;});
  const ctx=canvas.current.getContext('2d');
  function draw(){if(cancelled)return;const p=latest.current;if(p){const analyser=p.getAnalyser?.();const frequencies=analyser?new Uint8Array(analyser.frequencyBinCount):null;if(frequencies)analyser.getByteFrequencyData(frequencies);drawPortrait(ctx,{name:p.settings.name,title:p.station?.live||p.station?.camera?'Votre rendez-vous en direct':p.station?.current?.title||'La radio prépare son prochain rendez-vous.',subtitle:p.station?.playlistName||'La web radio d’AFOLUKU TV',status:p.station?.live||p.station?.camera?'EN DIRECT':p.station?.paused?'EN PAUSE':p.station?.active?'À L’ANTENNE':'HORS ANTENNE',logo,artwork,video:p.readVideo?.(),frequencies,position:p.readPosition?.()??p.station?.current?.offset??0,duration:p.station?.current?.duration||0});}frame=requestAnimationFrame(draw);}
  frame=requestAnimationFrame(draw);return()=>{cancelled=true;cancelAnimationFrame(frame);};
 },[settings.logoUrl,coverUrl,coverType]);
 return <canvas className="portrait-stage" ref={canvas} width={PORTRAIT_WIDTH} height={PORTRAIT_HEIGHT} role="img" aria-label={`${settings.name} — ${station?.current?.title||'Le direct'} — format 3:4`}/>;
}
