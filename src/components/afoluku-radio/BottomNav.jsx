import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Home, Radio, Newspaper, Menu } from 'lucide-react';

export default async function BottomNav({ lang = 'fr' }) {
  const { data: menus } = await supabase
    .from('menus')
    .select('*')
    .eq('location', 'header')
    .order('position', { ascending: true });

  return (
    <nav className="radio-bottom-nav">
      <Link href={`/${lang}`} className="nav-item">
        <Home size={24} />
        <span>Accueil</span>
      </Link>
      <Link href={`/${lang}/radio`} className="nav-item active">
        <Radio size={24} />
        <span>Radio</span>
      </Link>
      {menus?.slice(0, 2).map((menu, i) => (
        <Link key={menu.id} href={`/${lang}${menu.url}`} className="nav-item">
          {i === 0 ? <Newspaper size={24} /> : <Menu size={24} />}
          <span>{menu.label}</span>
        </Link>
      ))}
    </nav>
  );
}
