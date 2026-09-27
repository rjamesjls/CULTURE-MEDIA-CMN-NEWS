'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Radio, Newspaper, User, X } from 'lucide-react';
import { useState } from 'react';

export default function BottomNavClient({ lang = 'fr', categories = [] }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <nav className="mobile-bottom-nav">
        <Link href={`/${lang}`} className={`nav-item ${pathname === `/${lang}` ? 'active' : ''}`}>
          <Home size={24} />
          <span>Accueil</span>
        </Link>
        <button onClick={() => setDrawerOpen(true)} className="nav-item drawer-trigger">
          <Newspaper size={24} />
          <span>Articles</span>
        </button>
        <Link href={`/${lang}/radio`} className={`nav-item ${pathname?.includes('/radio') ? 'active' : ''}`}>
          <Radio size={24} />
          <span>Radio</span>
        </Link>
        <Link href={`/${lang}/profile`} className={`nav-item ${pathname?.includes('/profile') ? 'active' : ''}`}>
          <User size={24} />
          <span>Compte</span>
        </Link>
      </nav>

      {/* Drawer Overlay */}
      {drawerOpen && (
        <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} />
      )}

      {/* Side Drawer */}
      <div className={`categories-drawer ${drawerOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <h2>Catégories</h2>
          <button onClick={() => setDrawerOpen(false)} className="close-drawer">
            <X size={24} />
          </button>
        </div>
        <div className="drawer-content">
          {categories.map(cat => (
            <Link 
              key={cat.id} 
              href={`/${lang}/category/${cat.slug}`}
              className="category-link"
              onClick={() => setDrawerOpen(false)}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
