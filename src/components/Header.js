import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import FlashTicker from './FlashTicker';
import FlashTickerWrapper from './FlashTickerWrapper';
import SubscribeButton from './SubscribeButton';
import LanguageSwitcher from './LanguageSwitcher';
import { getDictionary } from '@/i18n/dictionaries';

import { createClient } from '@/utils/supabase/server';

export default async function Header({ lang = 'fr' }) {
  const supabaseClient = await createClient();
  const { data: { user } } = await supabaseClient.auth.getUser();
  const dict = await getDictionary(lang);

  const { data: menus } = await supabase
    .from('menus')
    .select('*')
    .eq('location', 'header')
    .order('position', { ascending: true });

  return (
    <>
      <header className="header" id="header" suppressHydrationWarning>
        <FlashTickerWrapper>
          <FlashTicker />
        </FlashTickerWrapper>
        <div className="header-container">
          <Link href={`/${lang}`} className="logo-link">
            <img 
              src="/afoluku-radio/logo.png" 
              alt="A FOLUKU TV" 
              className="header-logo" 
            />
          </Link>

          <nav className="nav-menu" id="navMenu">
            {!menus?.some(menu => menu.url === "/radio") && <Link href={`/${lang}/radio`} className="nav-link">Radio</Link>}
            {menus?.map((menu) => (
              <Link key={menu.id} href={`/${lang}${menu.url === '/' ? '' : menu.url}`} className={`nav-link ${menu.url === '/' ? 'active' : ''}`}>
                {menu.label}
              </Link>
            ))}

            <div className="search-bar">
              <i className="fas fa-search search-icon"></i>
              <input type="text" placeholder="Rechercher..." className="search-input" id="searchInput" />
            </div>

            {/* <Link href={`/${lang}/pro`} style={{ 
              background: '#F59E0B', color: '#FFF', fontWeight: 'bold', 
              padding: '4px 10px', borderRadius: '12px', textDecoration: 'none', 
              fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' 
            }}>
              {dict.nav.pro}
            </Link> */}

            {/* {user ? (
              <Link href={`/${lang}/profile`} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
                <i className="fas fa-user-circle" style={{ fontSize: '18px' }}></i>
                <span>Profil</span>
              </Link>
            ) : (
              <Link href="/auth/login" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
                <i className="fas fa-sign-in-alt"></i>
                <span>{dict.nav.login}</span>
              </Link>
            )} */}

            <SubscribeButton />
            
            {/* <LanguageSwitcher currentLang={lang} /> */}
          </nav>

          <button className="menu-toggle" id="menuToggle" aria-label="Toggle menu">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </header>

      {/* Main content offset for fixed header */}
      <div style={{ height: '70px' }}></div>
    </>
  );
}
