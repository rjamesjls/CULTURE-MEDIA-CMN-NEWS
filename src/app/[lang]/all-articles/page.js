import { supabase } from '@/lib/supabase';
import Link from 'next/link';

import { getDictionary } from '@/i18n/dictionaries';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang;
  return {
    title: 'Tous les articles | A FOLUKU TV',
    description: 'Retrouvez tous les articles de A FOLUKU TV.',
    alternates: {
      canonical: `/${lang}/all-articles`,
      languages: {
        'fr': '/fr/all-articles',
        'bsh': '/bsh/all-articles',
      },
    },
  };
}

export default async function AllArticlesPage({ params, searchParams }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang;
  const dict = await getDictionary(lang);
  const resolvedSearchParams = await searchParams;
  const searchQuery = resolvedSearchParams.search || '';

  let dbQuery = supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .order('pub_date', { ascending: false });

  if (searchQuery) {
    dbQuery = dbQuery.ilike('title', `%${searchQuery}%`);
  }

  const { data: articles, error } = await dbQuery;

  const getTitle = (article) => (lang === 'bsh' && article.title_bsh) ? article.title_bsh : article.title;

  return (
    <div className="container" style={{ margin: '140px auto 60px auto', minHeight: '60vh' }}>
      <header className="page-header" style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-heading)' }}>
          {searchQuery ? `Recherche : "${searchQuery}"` : dict.home?.all_news || 'Tous les articles'}
        </h1>
        <p style={{ color: 'var(--color-gray-600)', marginTop: '10px' }}>
          {searchQuery ? `${articles?.length || 0} résultat(s) trouvé(s)` : 'Retrouvez ici l\'intégralité de nos publications.'}
        </p>
      </header>

      {error ? (
        <p>{dict.home?.error_loading || 'Erreur lors du chargement des articles.'}</p>
      ) : articles && articles.length > 0 ? (
        <div className="articles-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}>
          {articles.map((article) => (
            <div key={article.id} className="article-card" style={{ border: '1px solid var(--color-gray-200)', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ height: '200px', overflow: 'hidden' }}>
                <img src={article.image_url || 'https://images.unsplash.com/photo-1620287341056-49a2f1ab2fdc?q=80&w=600&auto=format&fit=crop'} alt={getTitle(article)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ padding: '20px' }}>
                <span className="badge" style={{ background: 'var(--color-primary)', color: 'white', padding: '3px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                  {article.category}
                </span>
                <h3 style={{ margin: '10px 0', fontSize: '1.2rem', fontFamily: 'var(--font-heading)' }}>
                  <Link href={`/${lang}/article/${article.slug}`} style={{ color: 'var(--color-dark)' }}>
                    {getTitle(article)}
                  </Link>
                </h3>
                <p style={{ color: 'var(--color-gray-600)', fontSize: '0.9rem', marginBottom: '15px' }}>
                  {new Date(article.pub_date).toLocaleDateString(lang === 'bsh' ? 'bs-BA' : 'fr-FR')}
                </p>
                <Link href={`/${lang}/article/${article.slug}`} className="read-more" style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>
                  {dict.home?.read_more || 'Lire la suite'} <i className="fas fa-arrow-right"></i>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>{dict.category?.empty || 'Aucun article trouvé.'}</p>
      )}
    </div>
  );
}
