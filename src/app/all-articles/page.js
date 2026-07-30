import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export const revalidate = 60;

export const metadata = {
  title: 'Tous les articles | Culture Média News',
  description: 'Retrouvez tous les articles de Culture Média News.',
};

export default async function AllArticlesPage() {
  const { data: articles, error } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .order('pub_date', { ascending: false });

  return (
    <div className="container" style={{ margin: '140px auto 60px auto', minHeight: '60vh' }}>
      <header className="page-header" style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-heading)' }}>Tous les articles</h1>
        <p style={{ color: 'var(--color-gray-600)', marginTop: '10px' }}>
          Retrouvez ici l'intégralité de nos publications.
        </p>
      </header>

      {error ? (
        <p>Erreur lors du chargement des articles.</p>
      ) : articles && articles.length > 0 ? (
        <div className="articles-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}>
          {articles.map((article) => (
            <div key={article.id} className="article-card" style={{ border: '1px solid var(--color-gray-200)', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ height: '200px', overflow: 'hidden' }}>
                <img src={article.image_url} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ padding: '20px' }}>
                <span className="badge" style={{ background: 'var(--color-primary)', color: 'white', padding: '3px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                  {article.category}
                </span>
                <h3 style={{ margin: '10px 0', fontSize: '1.2rem', fontFamily: 'var(--font-heading)' }}>
                  <Link href={`/article/${article.slug}`} style={{ color: 'var(--color-dark)' }}>
                    {article.title}
                  </Link>
                </h3>
                <p style={{ color: 'var(--color-gray-600)', fontSize: '0.9rem', marginBottom: '15px' }}>
                  {new Date(article.pub_date).toLocaleDateString('fr-FR')}
                </p>
                <Link href={`/article/${article.slug}`} className="read-more" style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>
                  Lire la suite <i className="fas fa-arrow-right"></i>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>Aucun article publié pour le moment.</p>
      )}
    </div>
  );
}
