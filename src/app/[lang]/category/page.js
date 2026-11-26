import { supabase } from '@/lib/supabase';
import Link from 'next/link';

import { getDictionary } from '@/i18n/dictionaries';

export const revalidate = 60; // Revalidate every minute

export async function generateMetadata({ params, searchParams }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang;
  const resolvedSearchParams = await searchParams;
  const catSlug = resolvedSearchParams.cat;

  let title = 'Catégorie - A FOLUKU TV';

  if (catSlug) {
    const { data: category } = await supabase
      .from('categories')
      .select('name')
      .eq('slug', catSlug)
      .single();
    if (category) {
      title = `${category.name} - A FOLUKU TV`;
    }
  }

  return {
    title,
    alternates: {
      canonical: `/${lang}/category${catSlug ? `?cat=${catSlug}` : ''}`,
      languages: {
        'fr': `/fr/category${catSlug ? `?cat=${catSlug}` : ''}`,
        'bsh': `/bsh/category${catSlug ? `?cat=${catSlug}` : ''}`,
      },
    },
  };
}

export default async function CategoryPage({ params, searchParams }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang;
  const dict = await getDictionary(lang);
  const resolvedSearchParams = await searchParams;
  const catSlug = resolvedSearchParams.cat;

  // 1. Fetch category details
  let categoryName = 'Toutes les catégories';
  if (catSlug) {
    const { data: category } = await supabase
      .from('categories')
      .select('name')
      .eq('slug', catSlug)
      .single();
    if (category) {
      categoryName = category.name;
    }
  }

  // 2. Fetch articles
  let query = supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .order('pub_date', { ascending: false });

  if (catSlug) {
    // We assume the article category field matches the category slug or name.
    // In our schema, article.category currently stores the category name, NOT the slug.
    // So we should filter by the fetched categoryName.
    if (categoryName !== 'Toutes les catégories') {
        query = query.eq('category', categoryName);
    }
  }

  const { data: articles, error } = await query;

  const getTitle = (article) => (lang === 'bsh' && article.title_bsh) ? article.title_bsh : article.title;

  return (
    <>
      <section className="section featured-section" style={{ padding: '30px 0 60px 0', minHeight: '60vh' }}>
        <div className="container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 16px' }}>
          {/* Header épuré avec bouton retour */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Link
                href={`/${lang}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 16px',
                  borderRadius: '9999px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  color: '#475569',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <i className="fas fa-arrow-left" style={{ fontSize: '11px' }}></i>
                <span>{lang === 'bsh' ? 'Dray go baka' : 'Retour à l\'accueil'}</span>
              </Link>
              <h1 className="page-title" style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)', margin: 0, color: '#0f172a', fontWeight: '800' }}>
                {categoryName}
              </h1>
            </div>

            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', backgroundColor: '#f1f5f9', padding: '4px 12px', borderRadius: '9999px' }}>
              {articles?.length || 0} article{(articles?.length || 0) > 1 ? 's' : ''}
            </span>
          </div>

          <div className="grid grid-4 featured-grid">
            {error && <p>{dict.home?.error_loading || 'Erreur lors du chargement des articles.'}</p>}
            {(!articles || articles.length === 0) && !error && (
              <p>{dict.category?.empty || 'Aucun article trouvé dans cette catégorie.'}</p>
            )}
            {articles && articles.map(article => (
              <article key={article.id} className="card article-card">
                <div className="card-image-wrapper">
                  <img src={article.image_url || 'https://images.unsplash.com/photo-1620287341056-49a2f1ab2fdc?q=80&w=600&auto=format&fit=crop'} alt={getTitle(article)} className="card-image" loading="lazy" style={{ height: '200px', objectFit: 'cover' }} />
                  <span className="badge card-badge">{article.category}</span>
                </div>
                <div className="card-body">
                  <h3 className="card-title">
                    <Link href={`/${lang}/article/${article.slug}`}>{getTitle(article)}</Link>
                  </h3>
                  <div className="card-meta">
                    <span><i className="far fa-clock"></i> {new Date(article.pub_date).toLocaleDateString(lang === 'bsh' ? 'bs-BA' : 'fr-FR')}</span>
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
