import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/['"]/g, '');
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.replace(/['"]/g, '');
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('articles').select('id, slug, title, status').eq('slug', 'le-chanteur-badbay-mono-est-mort-apres-une-agression-par-arme-a-feu');
  console.log("BADBAY:");
  console.log(JSON.stringify({data, error}, null, 2));

  const { data: d2, error: e2 } = await supabase.from('articles').select('id, slug, title, status').eq('slug', 'maripasoula-kenza-agouinti-decroche-son-diplome-de-formation-approfondie-en-sciences-medicales');
  console.log("KENZA:");
  console.log(JSON.stringify({data: d2, error: e2}, null, 2));
}
check();
