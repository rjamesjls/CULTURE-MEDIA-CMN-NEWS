'use server';

import { createClient } from '@supabase/supabase-js';

export async function deleteCompany(id) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { error } = await supabase.from('companies').delete().eq('id', id);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
