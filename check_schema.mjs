import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkSchema() {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching comments:', error.message);
  } else if (data) {
    console.log('Comments table exists. Columns:', data.length > 0 ? Object.keys(data[0]) : 'Empty table');
  }
}

checkSchema();
