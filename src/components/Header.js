import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import FlashTicker from './FlashTicker';

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
          <Link href="/" className="logo-link">
            {/* Si Next.js Image pose problème avec le chemin local sans width/height, on utilise img classique ou on configure */}
            <img src="/assets/logo.png" alt="Culture Média News" className="header-logo" />
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

            <a href="#newsletter" className="btn btn-primary btn-sm">S'abonner</a>
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
