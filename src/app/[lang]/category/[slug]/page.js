import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { getDictionary } from '@/i18n/dictionaries';

export const revalidate = 60; // Revalidate every minute

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang;
  const slug = resolvedParams.slug;

  let title = 'Catégorie - A FOLUKU TV';

  if (slug) {
    const { data: category } = await supabase
      .from('categories')
      .select('name')
      .eq('slug', slug)
      .single();
    if (category) {
      title = `${category.name} - A FOLUKU TV`;
    }
  }

  return {
    title,
    alternates: {
      canonical: `/${lang}/category/${slug}`,
      languages: {
        'fr': `/fr/category/${slug}`,
        'bsh': `/bsh/category/${slug}`,
      },
    },
  };
}

export default async function CategorySlugPage({ params }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang;
  const slug = resolvedParams.slug;
  const dict = await getDictionary(lang);

  // 1. Fetch category details
  let categoryName = '';
  const { data: category } = await supabase
    .from('categories')
    .select('name, name_bsh')
    .eq('slug', slug)
    .single();

  if (category) {
    categoryName = (lang === 'bsh' && category.name_bsh) ? category.name_bsh : category.name;
  } else {
    categoryName = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');
  }

  // 2. Fetch articles matching this category
  let query = supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .order('pub_date', { ascending: false });

  if (category?.name) {
    query = query.ilike('category', `%${category.name}%`);
  } else {
    query = query.ilike('category', `%${slug.replace(/-/g, ' ')}%`);
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

          <div className="grid grid-4 featured-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {error && <p>{dict.home?.error_loading || 'Erreur lors du chargement des articles.'}</p>}
            {(!articles || articles.length === 0) && !error && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                <p style={{ color: '#64748b', fontSize: '1.1rem', margin: '0 0 16px 0' }}>
                  {dict.category?.empty || 'Aucun article trouvé dans cette rubrique pour le moment.'}
                </p>
                <Link href={`/${lang}`} className="btn btn-primary" style={{ display: 'inline-flex', padding: '8px 20px', borderRadius: '9999px', textDecoration: 'none' }}>
                  Retour à l'accueil
                </Link>
              </div>
            )}
            {articles && articles.map(article => (
              <article key={article.id} className="card article-card app-feed-card" style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                <div className="card-image-wrapper" style={{ position: 'relative', height: '190px' }}>
                  <img src={article.image_url || 'https://images.unsplash.com/photo-1620287341056-49a2f1ab2fdc?q=80&w=600&auto=format&fit=crop'} alt={getTitle(article)} className="card-image" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: article.seo_metadata?.image_position || 'center' }} />
                  <span className="badge card-badge" style={{ position: 'absolute', top: '10px', left: '10px' }}>{article.category}</span>
                </div>
                <div className="card-body" style={{ padding: '16px' }}>
                  <h3 className="card-title" style={{ fontSize: '1.05rem', fontWeight: '700', lineHeight: '1.35', margin: '0 0 10px 0' }}>
                    <Link href={`/${lang}/article/${article.slug}`} style={{ color: '#0f172a', textDecoration: 'none' }}>{getTitle(article)}</Link>
                  </h3>
                  <div className="card-meta" style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    <span><i className="far fa-clock"></i> {new Date(article.pub_date).toLocaleDateString(lang === 'bsh' ? 'bs-BA' : 'fr-FR')}</span>
                    {article.author && <span style={{ marginLeft: '12px' }}><i className="fas fa-user"></i> {article.author}</span>}
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
