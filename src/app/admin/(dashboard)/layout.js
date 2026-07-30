import './admin.css';
import Link from 'next/link';
import { getUserProfile } from '@/utils/supabase/auth';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Admin - Culture Média News',
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }) {
  const profile = await getUserProfile();

  if (!profile) {
    return (
      <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'var(--font-heading)' }}>
        <h2>Profil introuvable</h2>
        <p>Votre compte utilisateur n'a pas de profil associé ou une erreur s'est produite.</p>
        <form action={async () => {
            'use server';
            const { createClient } = require('@/utils/supabase/server');
            const supabase = await createClient();
            await supabase.auth.signOut();
            redirect('/admin/login');
          }}>
          <button type="submit" className="admin-btn admin-btn-primary" style={{ marginTop: '20px' }}>Déconnexion</button>
        </form>
      </div>
    );
  }

  if (profile.status === 'pending') {
    return (
      <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'var(--font-heading)' }}>
        <h2>Compte en attente</h2>
        <p>Votre compte est en attente de validation par un administrateur.</p>
        <form action={async () => {
            'use server';
            const { createClient } = require('@/utils/supabase/server');
            const supabase = await createClient();
            await supabase.auth.signOut();
            redirect('/admin/login');
          }}>
          <button type="submit" className="admin-btn admin-btn-primary" style={{ marginTop: '20px' }}>Déconnexion</button>
        </form>
      </div>
    );
  }

  if (profile.status === 'suspended') {
    return (
      <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'var(--font-heading)', color: 'red' }}>
        <h2>Compte suspendu</h2>
        <p>Votre compte a été suspendu.</p>
        <form action={async () => {
            'use server';
            const { createClient } = require('@/utils/supabase/server');
            const supabase = await createClient();
            await supabase.auth.signOut();
            redirect('/admin/login');
          }}>
          <button type="submit" className="admin-btn admin-btn-primary" style={{ marginTop: '20px' }}>Déconnexion</button>
        </form>
      </div>
    );
  }

  const isAdmin = profile.role === 'admin';

  return (
    <div className="admin-wrapper">
      {/* Admin Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <Link href="/admin">
            <h3>CMN Admin</h3>
          </Link>
        </div>
        <nav className="admin-nav">
          <Link href="/admin" className="admin-nav-link">
            <i className="fas fa-chart-line"></i> Dashboard
          </Link>
          <Link href="/admin/articles" className="admin-nav-link">
            <i className="fas fa-newspaper"></i> Articles
          </Link>
          
          <Link href="/admin/flash-infos" className="admin-nav-link">
            <i className="fas fa-bolt"></i> Flash Infos
          </Link>

          <Link href="/admin/ai-generator" className="admin-nav-link">
            <i className="fas fa-robot"></i> Générateur IA
          </Link>
          
          {isAdmin && (
            <>
              <Link href="/admin/categories" className="admin-nav-link">
                <i className="fas fa-tags"></i>
                Catégories
              </Link>
              <Link href="/admin/menus" className="admin-nav-link">
                <i className="fas fa-bars"></i>
                Menus
              </Link>
              <Link href="/admin/newsletter" className="admin-nav-link">
                <i className="fas fa-envelope"></i> Newsletter
              </Link>
              <Link href="/admin/users" className="admin-nav-link">
                <i className="fas fa-users"></i> Utilisateurs
              </Link>
            </>
          )}

          <Link href="/admin/articles/new" className="admin-nav-link">
            <i className="fas fa-plus"></i> Nouvel Article
          </Link>
        </nav>
        <div className="admin-footer-nav" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Link href="/" className="admin-nav-link">
            <i className="fas fa-external-link-alt"></i> Voir le site
          </Link>
          
          <form action={async () => {
            'use server';
            const { createClient } = require('@/utils/supabase/server');
            const { redirect } = require('next/navigation');
            const supabase = await createClient();
            await supabase.auth.signOut();
            redirect('/admin/login');
          }}>
            <button type="submit" className="admin-nav-link" style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', color: '#ef4444' }}>
              <i className="fas fa-sign-out-alt"></i> Déconnexion
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        {/* Top Navbar */}
        <header className="admin-header">
          <div className="admin-header-title">Espace d'administration</div>
        </header>

        {/* Page Content */}
        <div className="admin-content">
          {children}
        </div>
      </main>
    </div>
  );
}
