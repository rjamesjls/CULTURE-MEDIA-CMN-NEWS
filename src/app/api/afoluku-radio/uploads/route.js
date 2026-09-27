import {admin,handle,json,body,check,db,id} from '@/lib/afoluku-radio/server';
import {radioStorage,ensureRadioUploadCapacity} from '@/lib/afoluku-radio/storage';
export async function POST(req){return handle(async()=>{
 const user=await admin(req),data=await body(req);const {purpose,mime,size}=data;
 check(['track','cover','logo','import-cover'].includes(purpose),'Type d’import invalide.');
 const images=['image/png','image/jpeg','image/webp'],videos=['video/mp4','video/webm'],audio=['audio/mpeg','audio/mp4','audio/wav','audio/x-wav','audio/ogg','audio/flac','audio/aac','audio/webm'];
 check((purpose==='track'?[...audio,...videos]:purpose==='cover'?[...images,...videos]:images).includes(mime),'Format non pris en charge.');
 const max=purpose==='track'||videos.includes(mime)?100:30;check(Number.isSafeInteger(size)&&size>0&&size<=max*1024*1024,`Le fichier doit peser au maximum ${max} Mo.`);
 if(purpose==='track'){check(typeof data.title==='string'&&data.title.trim()&&data.title.length<=180,'Titre invalide.');check(Number.isFinite(data.duration)&&data.duration>0&&data.duration<14400,'Durée invalide.');}
 if(purpose==='cover'){id(data.trackId);check(await db().prepare('SELECT id FROM tracks WHERE id=?').bind(data.trackId).first(),'Titre introuvable.');if(videos.includes(mime))check(Number.isFinite(data.duration)&&data.duration>0&&data.duration<=120,'La pochette vidéo doit durer au maximum 2 minutes.');}
 if(purpose==='logo'||purpose==='import-cover')check(Number.isInteger(data.version)&&data.version>=0,'Version des paramètres invalide.');
 const uploadId=crypto.randomUUID(),trackId=purpose==='track'?crypto.randomUUID():data.trackId;
 const suffix=mime==='video/mp4'?'.mp4':mime==='video/webm'?'.webm':'';
 const key=purpose==='track'?`tracks/${trackId}`:purpose==='cover'?`covers/${trackId}/${uploadId}${suffix}`:purpose==='import-cover'?`import-covers/${uploadId}`:`radio-logo/${uploadId}`;
 // A token can create this one new object only; it cannot overwrite an existing file.
 await ensureRadioUploadCapacity(size);
 const {data:signed,error}=await radioStorage().createSignedUploadUrl(key,{upsert:false});if(error)throw error;
 await db().prepare('INSERT INTO uploads(id,owner_id,object_key,purpose,metadata,expires_at) VALUES(?,?,?,?,?,?)').bind(uploadId,user.id,key,purpose,JSON.stringify({...data,trackId}),Date.now()+7200000).run();
 return json({id:uploadId,path:key,token:signed.token});
});}
