import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.rpc('execute_sql', {
    sql_query: "ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS author_email VARCHAR(255);"
  });
  
  if (error) {
    console.error('Error with RPC:', error.message);
    // Let's try raw insert or we might need to use PSQL if we don't have execute_sql
  } else {
    console.log('Success:', data);
  }
}
main();
