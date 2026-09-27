import {admin,handle,json,id,check,ApiError,trackVisuals} from '@/lib/afoluku-radio/server';
import {transaction} from '@/lib/afoluku-radio/postgres';
import {signedMediaUrl,radioBucket} from '@/lib/afoluku-radio/storage';
import {imageType,videoType} from '@/lib/afoluku-radio/track-media';
import {settingsValue} from '@/lib/afoluku-radio/settings-server';
export async function POST(req,{params}){return handle(async()=>{
 const user=await admin(req),uploadId=id((await params).id);let obsolete=null;
 const result=await transaction(async client=>{
  const ticket=(await client.query('SELECT * FROM uploads WHERE id=$1 FOR UPDATE',[uploadId])).rows[0];
  if(!ticket||ticket.owner_id!==user.id)throw new ApiError(404,'Import introuvable.');
  if(ticket.result_json)return JSON.parse(ticket.result_json);
  check(Number(ticket.expires_at)>Date.now(),'Cet import a expiré. Recommencez.');
  const metadata=JSON.parse(ticket.metadata),key=ticket.object_key;
  // Only a bounded header is read by Vercel. The large upload goes straight to Storage.
  const response=await fetch(await signedMediaUrl(key,60),{headers:{Range:'bytes=0-63'},cache:'no-store'});
  check(response.status===206||(response.status===200&&Number(response.headers.get('content-length'))<=64),'Le fichier importé est indisponible.');
  const total=Number(response.headers.get('content-range')?.split('/')[1]||response.headers.get('content-length'));
  check(total===metadata.size,'Le fichier reçu est incomplet ou sa taille a changé.');
  const data=await response.arrayBuffer();check(data.byteLength<=64,'En-tête de fichier invalide.');
  const detected=imageType(data)||videoType(data);
  if(ticket.purpose!=='track'||metadata.mime.startsWith('video/'))check(detected===metadata.mime,'Le fichier ne correspond pas au format annoncé.');
  let saved;
  if(ticket.purpose==='track'){
   const settings=(await client.query('SELECT payload FROM radio_settings WHERE id=1')).rows[0];
   const defaults=JSON.parse(settings?.payload||'{}');
   await client.query('INSERT INTO tracks(id,title,duration,bytes,mime,created_at,music_genre,cover_key) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[metadata.trackId,metadata.title.trim(),metadata.duration,total,metadata.mime,Date.now(),defaults.importMusicGenre||null,defaults.importCoverKey||null]);saved={id:metadata.trackId};
  }else if(ticket.purpose==='cover'){
   const previous=(await client.query('SELECT id,cover_key,peaks FROM tracks WHERE id=$1 FOR UPDATE',[metadata.trackId])).rows[0];if(!previous)throw new ApiError(404,'Titre supprimé pendant l’import.');
   await client.query('UPDATE tracks SET cover_key=$1 WHERE id=$2',[key,metadata.trackId]);obsolete=previous.cover_key;saved=trackVisuals({...previous,cover_key:key});
  }else{
   await client.query("INSERT INTO radio_settings(id,payload,version) VALUES(1,'{}',0) ON CONFLICT DO NOTHING");
   const previous=(await client.query('SELECT * FROM radio_settings WHERE id=1 FOR UPDATE')).rows[0];if(previous.version!==metadata.version)throw new ApiError(409,'Les paramètres ont changé. Rechargez-les avant de modifier l’image.');
   if(ticket.purpose==='import-cover'){
    const payload=JSON.stringify({...JSON.parse(previous.payload),importCoverKey:key});
    await client.query('UPDATE radio_settings SET payload=$1,version=version+1 WHERE id=1',[payload]);
    saved=settingsValue({...previous,payload,version:previous.version+1});
   }else{
    await client.query('UPDATE radio_settings SET logo_key=$1,version=version+1 WHERE id=1',[key]);obsolete=previous.logo_key;saved=settingsValue({...previous,logo_key:key,version:previous.version+1});
   }
  }
  await client.query('UPDATE uploads SET result_json=$1 WHERE id=$2',[JSON.stringify(saved),uploadId]);return saved;
 });
 if(obsolete && !obsolete.startsWith('import-covers/'))try{await radioBucket.delete(obsolete)}catch(error){console.error('Radio media cleanup failed',error.message)}
 return json(result);
});}
