export const PORTRAIT_WIDTH = 1080, PORTRAIT_HEIGHT = 1350;
const NAVY='#080f26', YELLOW='#ffd21c', RED='#e21c2a', WHITE='#ffffff';
// The frame follows the source aspect ratio: no side bars, crop, stretching or repeated image.
export function mediaBounds(media,box={x:40,y:225,width:640,height:360}) {
 const width=media?.videoWidth||media?.naturalWidth, height=media?.videoHeight||media?.naturalHeight;
 if(!width||!height||('readyState' in media&&media.readyState<2))return null;
 const scale=Math.min(box.width/width,box.height/height);
 return {x:box.x+(box.width-width*scale)/2,y:box.y+(box.height-height*scale)/2,width:width*scale,height:height*scale};
}
export function drawPortrait(ctx,{title,subtitle,logo,artwork,video,frequencies,position=0,duration=0}) {
 ctx.save();ctx.scale(PORTRAIT_WIDTH/720,PORTRAIT_HEIGHT/900);
 ctx.fillStyle=NAVY;ctx.fillRect(0,0,720,900);
 function rounded(x,y,w,h,r,fill){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}}
 function text(value,x,y,width,size,{family='Afoluku Poppins',weight=700,color=WHITE,lines=1}={}) {
  ctx.fillStyle=color;ctx.textAlign='left';ctx.textBaseline='alphabetic';const content=String(value||'');let rows=[];
  function wrap(){ctx.font=`${weight} ${size}px "${family}", sans-serif`;rows=[];let line='';for(const char of content){if(ctx.measureText(line+char).width>width&&line){rows.push(line.trim());line=char;}else line+=char;}if(line)rows.push(line.trim());}
  wrap();while(rows.length>lines&&size>12){size--;wrap();}rows.slice(0,lines).forEach((line,i)=>ctx.fillText(line,x,y+i*size*1.2));
 }
 if(logo?.naturalWidth){const cropped=logo.naturalWidth===718&&logo.naturalHeight===251&&/\/afoluku-radio\/logo\.png(?:\?|$)/.test(logo.src||'');const sy=cropped?107:0,sh=logo.naturalHeight-sy;const scale=Math.min(320/logo.naturalWidth,92/sh);ctx.drawImage(logo,0,sy,logo.naturalWidth,sh,40,28,logo.naturalWidth*scale,sh*scale);}
 // Fit the heavy uppercase lettering to the badge's inner bounds using real glyph metrics.
 const badge={x:410,y:53,width:270,height:0};
 ctx.textAlign='left';ctx.textBaseline='alphabetic';let size=46,metrics;
 do{ctx.font=`900 ${size}px "Afoluku Montserrat", sans-serif`;metrics=ctx.measureText('#MUSIQUE');if(metrics.width<=badge.width-12)break;size--;}while(size>12);
 badge.height=metrics.actualBoundingBoxAscent+metrics.actualBoundingBoxDescent+8;rounded(badge.x,badge.y,badge.width,badge.height,8,RED);
 ctx.fillStyle=WHITE;ctx.fillText('#MUSIQUE',badge.x+(badge.width-metrics.width)/2,badge.y+(badge.height+metrics.actualBoundingBoxAscent-metrics.actualBoundingBoxDescent)/2);
 text('Extrait Radio',40,167,640,53,{family:'Afoluku Anton',weight:400,color:YELLOW});
 text('cette semaine',40,201,640,22,{weight:300});
 const media=mediaBounds(video)?video:mediaBounds(artwork)?artwork:null;
 if(media){const b=mediaBounds(media);ctx.save();rounded(b.x,b.y,b.width,b.height,16);ctx.clip();ctx.drawImage(media,b.x,b.y,b.width,b.height);ctx.restore();}
 else {rounded(40,225,640,360,16,'#030611');text('RADIO',70,436,580,90,{family:'Afoluku Anton',weight:400,color:YELLOW});}
 text(title,40,613,640,27,{lines:2});
 text(subtitle,40,679,640,16,{weight:300,color:'#d8deed'});
 const bins=frequencies||new Uint8Array(48);const gradient=ctx.createLinearGradient(0,790,0,709);gradient.addColorStop(0,YELLOW);gradient.addColorStop(1,RED);ctx.fillStyle=gradient;
 for(let i=0;i<48;i++){const magnitude=bins[Math.floor(i*bins.length/48)]||0,height=Math.max(3,magnitude/255*77);ctx.fillRect(40+i*13.4,790-height,8,height);}
 rounded(40,807,640,4,2,'#29334c');rounded(40,807,duration>0?640*Math.max(0,Math.min(1,position/duration)):0,4,2,YELLOW);
 const time=n=>`${Math.floor(n/60)}:${String(Math.floor(n%60)).padStart(2,'0')}`;
 text(time(position),40,833,250,15,{weight:300,color:'#d8deed'});text(time(duration),608,833,72,15,{weight:300,color:'#d8deed'});
 text('AFOLUKU TV · A MEDIA FU WI',40,861,640,19,{color:YELLOW});
 text('WI MEDIA, WI KULTURU, WI TOLI',40,887,640,16,{weight:300});
 ctx.restore();
}
export function portraitImage(src) {
 if(!src)return Promise.resolve(null);
 return new Promise(resolve=>{const img=new Image();const timer=setTimeout(()=>resolve(null),10000);img.crossOrigin='anonymous';img.onload=()=>{clearTimeout(timer);resolve(img);};img.onerror=()=>{clearTimeout(timer);resolve(null);};img.src=src;});
}
