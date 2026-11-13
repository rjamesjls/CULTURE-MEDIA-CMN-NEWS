import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import SubscribeButton from './SubscribeButton';
import { getDictionary } from '@/i18n/dictionaries';
import { createClient } from '@/utils/supabase/server';

export default async function Header({ lang = 'fr' }) {
  const supabaseClient = await createClient();
  const dict = await getDictionary(lang);

  const { data: menus } = await supabase
    .from('menus')
    .select('*')
    .eq('location', 'header')
    .order('position', { ascending: true });

  return (
    <>
      <header className="header" id="header" suppressHydrationWarning>
        <div className="header-container">
          <Link href={`/${lang}`} className="logo-link" title="A FOLUKU TV - Accueil">
            <img 
              src="/afoluku-tv-logo.png" 
              alt="A FOLUKU TV" 
              className="header-logo" 
            />
          </Link>

          <nav className="nav-menu" id="navMenu">
            {!menus?.some(menu => menu.url === "/radio") && (
              <Link href={`/${lang}/radio`} className="nav-link">
                Radio
              </Link>
            )}
            {menus?.map((menu) => (
              <Link key={menu.id} href={`/${lang}${menu.url === '/' ? '' : menu.url}`} className={`nav-link ${menu.url === '/' ? 'active' : ''}`}>
                {menu.label}
              </Link>
            ))}

            <div className="search-bar">
              <i className="fas fa-search search-icon"></i>
              <input type="text" placeholder="Rechercher..." className="search-input" id="searchInput" />
            </div>

            <SubscribeButton />
          </nav>
        </div>
      </header>

      {/* Espacement compensatoire sous le header fixe */}
      <div className="header-spacer"></div>
    </>
  );
}
