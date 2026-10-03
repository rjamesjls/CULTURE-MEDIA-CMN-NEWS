const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkMenus() {
  const { data, error } = await supabase.from('menus').select('*');
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}

checkMenus();
