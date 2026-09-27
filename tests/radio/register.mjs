import {registerHooks} from 'node:module';
import {existsSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=new URL('../../',import.meta.url);
registerHooks({resolve(specifier,context,next){
 const mocks={'pg':'pg.mjs','@/utils/supabase/server':'auth.mjs','@/lib/afoluku-radio/storage':'storage.mjs'};
 if(mocks[specifier])return {url:new URL(mocks[specifier],import.meta.url).href,shortCircuit:true};
 if(specifier==='./storage'&&context.parentURL?.includes('/src/lib/afoluku-radio/'))return {url:new URL('storage.mjs',import.meta.url).href,shortCircuit:true};
 if(specifier.startsWith('@/'))return {url:new URL('src/'+specifier.slice(2)+'.js',root).href,shortCircuit:true};
 if(specifier.startsWith('.')&&context.parentURL?.startsWith(root.href)){const u=new URL(specifier,context.parentURL);if(!existsSync(fileURLToPath(u))&&existsSync(fileURLToPath(u)+'.js'))return {url:pathToFileURL(fileURLToPath(u)+'.js').href,shortCircuit:true};}
 return next(specifier,context);
}});
