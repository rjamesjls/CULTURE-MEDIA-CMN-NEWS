import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';

export const metadata = {
  title: 'Posts Instagram - Admin',
};

export default async function InstagramDashboardPage() {
  const supabase = await createClient();

  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, pub_date, image_url')
    .order('pub_date', { ascending: false })
    .limit(20);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)' }}>Création de Posts Instagram</h1>
        <Link href="/admin/instagram/custom" className="admin-btn admin-btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontWeight: 'bold' }}>
          <i className="fas fa-magic"></i> Info Courte Libre (1080x1350)
        </Link>
      </div>

      <div style={{ background: '#FFF', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <p style={{ marginBottom: '20px', color: 'var(--color-gray-500)' }}>Sélectionnez un article pour générer automatiquement son visuel Instagram (au format carré ou story).</p>
        
        {error ? (
          <div style={{ color: 'red' }}>Erreur de chargement des articles</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {articles.map(article => (
              <div key={article.id} style={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: '150px', background: '#F1F5F9', position: 'relative' }}>
                  <img src={article.image_url || 'https://images.unsplash.com/photo-1620287341056-49a2f1ab2fdc?q=80&w=400&auto=format&fit=crop'} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '15px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '10px', fontFamily: 'var(--font-heading)' }}>{article.title}</h3>
                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
                    <Link href={`/admin/articles/${article.id}/instagram`} className="admin-btn admin-btn-primary" style={{ fontSize: '0.9rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fab fa-instagram"></i> Créer le visuel
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
