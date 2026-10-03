import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: buckets } = await supabase.storage.listBuckets();
  console.log("Buckets:", buckets?.map(b => b.name));

  const { data, error } = await supabase
    .from('media_library')
    .select('id')
    .limit(1);
  if (error) {
    console.log("Table media_library does not exist or error:", error.message);
  } else {
    console.log("Table media_library exists!");
  }
}
check();
