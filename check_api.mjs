import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase
    .from('saved_carousels')
    .select('id, title, updated_at, pages_data')
    .order('updated_at', { ascending: false });

  console.log("Error:", error);
}
check();
