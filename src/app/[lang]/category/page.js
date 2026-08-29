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
      <div className="page-header" style={{ padding: '60px 0', background: 'var(--color-dark)', color: 'white', textAlign: 'center' }}>
        <div className="container">
          <h1 className="page-title" style={{ fontSize: '3rem', fontFamily: 'var(--font-heading)' }}>{categoryName}</h1>
          <p style={{ color: 'var(--color-gray-400)', marginTop: '15px' }}>{dict.category?.subtitle || 'Retrouvez tous nos articles dans cette rubrique.'}</p>
        </div>
      </div>

      <section className="section featured-section">
        <div className="container">
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
