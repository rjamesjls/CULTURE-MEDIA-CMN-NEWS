import {identity} from './runtime.mjs';
export async function createClient(){return {auth:{getUser:async()=>({data:{user:identity.user}})},from:()=>({select:()=>({eq:()=>({single:async()=>({data:identity.profile})})})})}}
