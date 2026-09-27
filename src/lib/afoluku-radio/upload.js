import {createClient} from '@/utils/supabase/client';
import {api} from './audio';
export async function uploadRadioFile(file,metadata){
 const ticket=await api('/api/afoluku-radio/uploads','POST',{...metadata,size:file.size});
 const {error}=await createClient().storage.from('afoluku-radio').uploadToSignedUrl(ticket.path,ticket.token,file,{contentType:metadata.mime});
 if(error)throw new Error(`Import impossible : ${error.message}`);
 // Completion is idempotent: a lost response can be retried without duplicating the title.
 for(let attempt=0;attempt<2;attempt++){try{return await api(`/api/afoluku-radio/uploads/${ticket.id}`,'POST',{})}catch(error){if(attempt)throw error;}}
}
