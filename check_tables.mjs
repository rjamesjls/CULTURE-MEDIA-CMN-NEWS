import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: d1, error: e1 } = await supabase.from('media_library').select('id').limit(1);
  console.log("media_library:", e1 ? e1.message : "OK");
  
  const { data: d2, error: e2 } = await supabase.from('saved_carousels').select('id').limit(1);
  console.log("saved_carousels:", e2 ? e2.message : "OK");
}
check();
