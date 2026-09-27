import {createClient} from '@supabase/supabase-js';
export const RADIO_BUCKET='afoluku-radio';
let service;
export function radioStorage(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw Object.assign(new Error('Le stockage de la radio doit être configuré.'),{radioConfiguration:true});
 service||=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 return service.storage.from(RADIO_BUCKET);
}
export async function signedMediaUrl(key,seconds=3600){const {data,error}=await radioStorage().createSignedUrl(key,seconds);if(error)throw error;return data.signedUrl;}
export async function mediaRedirect(key){return new Response(null,{status:307,headers:{Location:await signedMediaUrl(key),'Cache-Control':'no-store'}})}
export const radioBucket={
 async put(key,data,options){const {error}=await radioStorage().upload(key,data,{contentType:options?.httpMetadata?.contentType||'application/octet-stream',upsert:true});if(error)throw error;},
 async delete(keys){const {error}=await radioStorage().remove(Array.isArray(keys)?keys:[keys]);if(error)throw error;},
 async get(key){const response=await fetch(await signedMediaUrl(key,60),{cache:'no-store'});if(response.status===404||response.status===400)return null;if(!response.ok)throw new Error('Lecture du média impossible.');return {body:response.body,size:Number(response.headers.get('content-length')),httpMetadata:{contentType:response.headers.get('content-type')}};}
};

let capacityReady;
export async function ensureRadioUploadCapacity(size) {
 if(size<=50*1024*1024)return;
 radioStorage();
 capacityReady ||= (async()=>{
  const {data:bucket,error}=await service.storage.getBucket(RADIO_BUCKET);
  if(error)throw error;
  if(bucket.file_size_limit !== null && Number(bucket.file_size_limit)<100*1024*1024){
   const {error:updateError}=await service.storage.updateBucket(RADIO_BUCKET,{public:false,fileSizeLimit:100*1024*1024,allowedMimeTypes:bucket.allowed_mime_types});
   if(updateError)throw new Error('Le stockage Supabase refuse la limite de 100 Mo. Vérifiez sa limite globale de taille des fichiers, puis réessayez.');
  }
 })().catch(error=>{capacityReady=undefined;throw error;});
 await capacityReady;
}
