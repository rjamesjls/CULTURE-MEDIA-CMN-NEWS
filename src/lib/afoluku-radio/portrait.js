export const PORTRAIT_WIDTH = 1080, PORTRAIT_HEIGHT = 1440;
export function drawPortrait(ctx, { title, subtitle, logo, artwork, video, frequencies, position = 0, duration = 0 }) {
    ctx.save();ctx.scale(PORTRAIT_WIDTH/720,PORTRAIT_HEIGHT/960);
    const w=720,h=960;
    ctx.fillStyle='#121810';ctx.fillRect(0,0,w,h);
    ctx.strokeStyle='#3c492e';ctx.lineWidth=2;ctx.strokeRect(1,1,w-2,h-2);
    function text(value,x,y,width,size,color='#fff',lines=1){
        ctx.fillStyle=color;ctx.textAlign='left';
        const content=String(value||'');let rows=[];
        function wrap(){ctx.font=`600 ${size}px Arial`;rows=[];let line='';for(const char of content){if(ctx.measureText(line+char).width>width&&line){rows.push(line.trim());line=char;}else line+=char;}if(line)rows.push(line.trim());}
        wrap();while(rows.length>lines&&size>12){size--;wrap();}
        rows.slice(0,lines).forEach((line,index)=>ctx.fillText(line,x,y+index*size*1.2));
    }
    function contain(media,x,y,width,height){
        if(media && 'readyState' in media && media.readyState<2)return false;
        const mw=media?.videoWidth||media?.naturalWidth,mh=media?.videoHeight||media?.naturalHeight;
        if(!mw||!mh)return false;
        const cropped=media.naturalWidth===718 && media.naturalHeight===251 && /\/afoluku-radio\/logo\.png(?:\?|$)/.test(media.src||'');
        const sy=cropped?107:0,sh=mh-sy;
        const scale=Math.min(width/mw,height/sh);ctx.drawImage(media,0,sy,mw,sh,x+(width-mw*scale)/2,y+(height-sh*scale)/2,mw*scale,sh*scale);return true;
    }
    contain(logo,40,24,320,94);
    text('Extrait Radio',40,154,640,44,'#ffd21c');
    ctx.font='300 22px "Helvetica Neue", Arial';ctx.fillStyle='#fff';ctx.fillText('cette semaine',40,189);
    ctx.fillStyle='#d71920';ctx.fillRect(490,43,190,44);
    text('#musique',511,73,150,24);
    ctx.fillStyle='#0b100a';ctx.fillRect(40,230,640,270);
    if(!contain(video,40,230,640,270)&&!contain(artwork,40,230,640,270))text('Radio',40,390,640,72,'#ffd21c');
    text(title,40,544,640,28,'#fff',3);
    text(subtitle,40,659,640,18,'#bdc9b1',2);
    const bins=frequencies||new Uint8Array(48);
    ctx.fillStyle='#b2d952';
    for(let i=0;i<48;i++){const magnitude=bins[Math.floor(i*bins.length/48)]||0;const height=Math.max(3,magnitude/255*112);ctx.fillRect(40+i*13.4,832-height,8,height);}
    ctx.fillStyle='#36402b';ctx.fillRect(40,861,640,5);ctx.fillStyle='#ffd21c';ctx.fillRect(40,861,duration>0?640*Math.min(1,position/duration):0,5);
    const time=n=>`${Math.floor(n/60)}:${String(Math.floor(n%60)).padStart(2,'0')}`;
    text(time(position),40,897,250,20,'#bdc9b1');text(time(duration),608,897,72,20,'#bdc9b1');
    text('AFOLUKU TV · UNE VOIX. UNE CULTURE. UNE CONNEXION.',40,937,640,15,'#bdc9b1');
    ctx.restore();
}
export function portraitImage(src) {
    if(!src)return Promise.resolve(null);
    return new Promise(resolve=>{const img=new Image();const timer=setTimeout(()=>resolve(null),10000);img.crossOrigin='anonymous';img.onload=()=>{clearTimeout(timer);resolve(img);};img.onerror=()=>{clearTimeout(timer);resolve(null);};img.src=src;});
}
