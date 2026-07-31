import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import FlashTicker from './FlashTicker';
import SubscribeButton from './SubscribeButton';

export default async function Header() {
  const { data: menus } = await supabase
    .from('menus')
    .select('*')
    .eq('location', 'header')
    .order('position', { ascending: true });

  return (
    <>
      <header className="header" id="header" suppressHydrationWarning>
        <FlashTicker />
        <div className="header-container">
          <Link href="/" className="logo-link" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <img src="/assets/logo.png" alt="Culture Média News" className="header-logo" />
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ 
                fontFamily: 'var(--font-heading)', 
                fontSize: '22px', 
                fontWeight: '900', 
                color: 'var(--color-white, #FFFFFF)', 
                letterSpacing: '-0.5px',
                whiteSpace: 'nowrap',
                lineHeight: '1.1'
              }}>
                CULTURE <span style={{ color: 'var(--color-primary)' }}>MEDIA</span>
              </span>
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                fontWeight: '400',
                color: 'var(--color-white, #FFFFFF)',
                letterSpacing: '1px',
                whiteSpace: 'nowrap',
                opacity: 0.8
              }}>
                CMN NEWS
              </span>
            </div>
          </Link>

          <nav className="nav-menu" id="navMenu">
            {menus?.map((menu) => (
              <Link key={menu.id} href={menu.url} className={`nav-link ${menu.url === '/' ? 'active' : ''}`}>
                {menu.label}
              </Link>
            ))}

            <div className="search-bar">
              <i className="fas fa-search search-icon"></i>
              <input type="text" placeholder="Rechercher..." className="search-input" id="searchInput" />
            </div>

            <Link href="/pro" style={{ 
              background: '#F59E0B', color: '#FFF', fontWeight: 'bold', 
              padding: '4px 10px', borderRadius: '12px', textDecoration: 'none', 
              fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' 
            }}>
              Espace PRO
            </Link>

            <SubscribeButton />
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
