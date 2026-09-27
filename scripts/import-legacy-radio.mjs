// This script only imports the former radio library from this site's Supabase.
// It never changes the on-air programme or deletes legacy tracks/files.
import pg from 'pg';
import {createClient} from '@supabase/supabase-js';
const apply=process.argv.includes('--apply');
const {RADIO_DATABASE_URL,NEXT_PUBLIC_SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY}=process.env;
if(!RADIO_DATABASE_URL||!NEXT_PUBLIC_SUPABASE_URL||!SUPABASE_SERVICE_ROLE_KEY)throw new Error('Configurez les variables radio côté serveur avant de lancer cet outil.');
const db=new pg.Client({connectionString:RADIO_DATABASE_URL});
const storage=createClient(NEXT_PUBLIC_SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}}).storage;
const oldBucket=storage.from('webradio'),newBucket=storage.from('afoluku-radio');
function objectPath(value){if(!value)return null;if(!/^https?:\/\//.test(value))return value.replace(/^\/?webradio\//,'').replace(/^\//,'');const url=new URL(value);if(url.origin!==new URL(NEXT_PUBLIC_SUPABASE_URL).origin)return null;const prefix='/storage/v1/object/public/webradio/';return url.pathname.startsWith(prefix)?decodeURIComponent(url.pathname.slice(prefix.length)):null}
try{
 await db.connect();const exists=await db.query("SELECT to_regclass('public.radio_tracks') AS name");if(!exists.rows[0].name){console.log('Aucune ancienne bibliothèque radio à importer.');process.exitCode=0;}else{
 const {rows}=await db.query('SELECT t.* FROM public.radio_tracks t WHERE NOT EXISTS(SELECT 1 FROM afoluku_radio.tracks n WHERE n.id=t.id::text)');
 console.log(`${rows.length} titre(s) à examiner. ${apply?'Import activé.':'Simulation : ajoutez --apply pour importer.'}`);
 for(const track of rows){try{
  const source=objectPath(track.audio_url);const duration=Number(track.duration_ms)/1000;if(!source||!(duration>0&&duration<14400)){console.log(`Ignoré ${track.id} : chemin externe ou durée manquante.`);continue;}
  if(!apply){console.log(`Import possible : ${track.id}`);continue;}
  const {data:file,error}=await oldBucket.download(source);if(error)throw error;
  const mime=file.type.split(';')[0];if(!['audio/mpeg','audio/mp4','audio/wav','audio/x-wav','audio/ogg','audio/flac','audio/aac','audio/webm','video/mp4','video/webm'].includes(mime)||!file.size||file.size>50*1024*1024)throw new Error('Format ou taille non pris en charge.');
  const key='tracks/'+track.id;const upload=await newBucket.upload(key,file,{contentType:mime,upsert:false});if(upload.error)throw upload.error;
  let coverKey=null;const cover=objectPath(track.cover_url);if(cover){const downloaded=await oldBucket.download(cover);if(downloaded.data&&['image/png','image/jpeg','image/webp'].includes(downloaded.data.type)&&downloaded.data.size<=5*1024*1024){const next=`covers/${track.id}/${crypto.randomUUID()}`;const result=await newBucket.upload(next,downloaded.data,{contentType:downloaded.data.type});if(!result.error)coverKey=next;}}
  try{await db.query('INSERT INTO afoluku_radio.tracks(id,title,duration,bytes,mime,cover_key,created_at) VALUES($1,$2,$3,$4,$5,$6,$7)',[track.id,[track.artist,track.title].filter(Boolean).join(' — ').slice(0,180)||'Sans titre',duration,file.size,mime,coverKey,Date.parse(track.created_at)||Date.now()]);}catch(error){await newBucket.remove([key,...(coverKey?[coverKey]:[])]);throw error;}
  console.log(`Importé : ${track.id}`);
 }catch(error){console.error(`Échec ${track.id} : ${error.message}`);process.exitCode=1;}}
 }
}finally{await db.end()}
