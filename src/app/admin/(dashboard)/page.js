import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default async function AdminDashboard() {
  const { count, error } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true });

  return (
    <div>
      <h2 style={{ marginBottom: '20px', fontFamily: 'var(--font-heading)' }}>Vue d'ensemble</h2>
      
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <i className="fas fa-newspaper"></i>
          </div>
          <div className="admin-stat-info">
            <h4>Total Articles</h4>
            <div className="stat-value">{count || 0}</div>
          </div>
        </div>
        
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
            <i className="fas fa-eye"></i>
          </div>
          <div className="admin-stat-info">
            <h4>Visites (Démo)</h4>
            <div className="stat-value">1,245</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '40px' }}>
        <h3>Actions Rapides</h3>
        <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
          <Link href="/admin/articles/new" className="admin-btn admin-btn-primary">
            <i className="fas fa-plus"></i> Rédiger un nouvel article
          </Link>
          <Link href="/admin/articles" className="admin-btn" style={{ backgroundColor: '#e5e7eb', color: '#374151' }}>
            <i className="fas fa-list"></i> Gérer les articles
          </Link>
        </div>
      </div>
    </div>
  );
}
