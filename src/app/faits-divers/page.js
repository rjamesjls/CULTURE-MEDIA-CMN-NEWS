import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export const revalidate = 60; // Revalidate every minute

export const metadata = {
  title: 'Faits Divers - Culture Média News',
};

export default async function FaitsDivers() {
  const { data: articles, error } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .order('pub_date', { ascending: false });

  return (
    <>
      <div className="page-header" style={{ padding: '60px 0', background: 'var(--color-dark)', color: 'white', textAlign: 'center' }}>
        <div className="container">
          <h1 className="page-title" style={{ fontSize: '3rem', fontFamily: 'var(--font-heading)' }}>Faits divers</h1>
          <p style={{ color: 'var(--color-gray-400)', marginTop: '15px' }}>Toutes les actualités et les événements récents.</p>
        </div>
      </div>

      <section className="section featured-section">
        <div className="container">
          <div className="grid grid-4 featured-grid">
            {error && <p>Erreur lors du chargement des articles.</p>}
            {articles && articles.map(article => (
              <article key={article.id} className="card article-card">
                <div className="card-image-wrapper">
                  <img src={article.image_url || 'https://images.unsplash.com/photo-1620287341056-49a2f1ab2fdc?q=80&w=600&auto=format&fit=crop'} alt={article.title} className="card-image" loading="lazy" style={{ height: '200px', objectFit: 'cover' }} />
                  <span className="badge card-badge">{article.category}</span>
                </div>
                <div className="card-body">
                  <h3 className="card-title">
                    <Link href={`/article/${article.slug}`}>{article.title}</Link>
                  </h3>
                  <div className="card-meta">
                    <span><i className="far fa-clock"></i> {new Date(article.pub_date).toLocaleDateString('fr-FR')}</span>
                    <span style={{ marginLeft: '10px' }}><i className="fas fa-user"></i> {article.author}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
