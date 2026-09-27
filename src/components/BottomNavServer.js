import { supabase } from '@/lib/supabase';
import BottomNavClient from './BottomNavClient';

export default async function BottomNavServer({ lang = 'fr' }) {
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });

  return <BottomNavClient lang={lang} categories={categories || []} />;
}
