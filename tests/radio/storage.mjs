import {objects} from './runtime.mjs';
export const RADIO_BUCKET='afoluku-radio';
export const radioBucket={async put(key,data,options){objects.set(key,{data:new Uint8Array(data),mime:options?.httpMetadata?.contentType||'application/octet-stream'})},async delete(keys){for(const key of Array.isArray(keys)?keys:[keys])objects.delete(key)},async get(key){const o=objects.get(key);return o?{body:o.data,size:o.data.length,httpMetadata:{contentType:o.mime}}:null}};
export const radioStorage=()=>({createSignedUploadUrl:async key=>({data:{token:'test-only',path:key}})});
export async function signedMediaUrl(key){return 'https://radio-storage.test/'+key}
export async function mediaRedirect(key){return new Response(null,{status:307,headers:{Location:await signedMediaUrl(key)}})}
