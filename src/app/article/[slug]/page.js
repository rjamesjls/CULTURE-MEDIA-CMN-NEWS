import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const revalidate = 60; // Revalidate every minute

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const { data: article } = await supabase
    .from('articles')
    .select('title, description')
    .eq('slug', slug)
    .single();

  if (!article) return { title: 'Article non trouvé' };

  return {
    title: `${article.title} | Culture Média News`,
    description: article.description
  };
}

export default async function ArticlePage({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  
  const { data: article, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !article) {
    notFound();
  }

  return (
    <>
      <article className="article-container" style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
        <header className="article-header">
          <span className="badge" style={{ background: 'var(--color-primary)', color: 'white', padding: '5px 10px', borderRadius: '4px' }}>
            {article.category}
          </span>
          <h1 className="article-title" style={{ fontSize: '2.5rem', marginTop: '15px', fontFamily: 'var(--font-heading)' }}>
            {article.title}
          </h1>
          <div className="article-meta" style={{ display: 'flex', gap: '20px', color: 'var(--color-gray-500)', marginTop: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--color-gray-200)' }}>
            <span className="author">
              <i className="far fa-user"></i> {article.author || 'La Rédaction'}
            </span>
            <time dateTime={article.pub_date}>
              <i className="far fa-calendar"></i> {new Date(article.pub_date).toLocaleDateString('fr-FR')}
            </time>
          </div>
        </header>

        <div className="article-featured-image" style={{ margin: '30px 0' }}>
          <img src={article.image_url} alt={article.title} style={{ width: '100%', borderRadius: '8px' }} />
        </div>

        <div className="article-body" style={{ fontSize: '1.1rem', lineHeight: '1.8', color: 'var(--color-dark)' }}>
          <div dangerouslySetInnerHTML={{ __html: article.content }} />
        </div>

        <footer className="article-footer" style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid var(--color-gray-200)' }}>
          <Link href="/faits-divers" className="btn btn-secondary">
            <i className="fas fa-arrow-left"></i> Retour aux faits divers
          </Link>
        </footer>
      </article>
    </>
  );
}
