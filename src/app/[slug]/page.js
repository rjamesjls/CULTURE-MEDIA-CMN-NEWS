import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';

export const revalidate = 60; // Revalidate every minute

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const { data: page } = await supabase
    .from('pages')
    .select('title')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (!page) return { title: 'Page non trouvée' };

  return {
    title: `${page.title} | Culture Média News`,
  };
}

export default async function CustomPage({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  
  const { data: page, error } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !page) {
    notFound();
  }

  return (
    <>
      <article className="article-container" style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px', minHeight: '60vh' }}>
        <header className="article-header" style={{ marginBottom: '40px' }}>
          <h1 className="article-title" style={{ fontSize: '2.5rem', marginTop: '15px', fontFamily: 'var(--font-heading)' }}>
            {page.title}
          </h1>
        </header>

        <div className="article-body" style={{ fontSize: '1.1rem', lineHeight: '1.8', color: 'var(--color-dark)' }}>
          <div dangerouslySetInnerHTML={{ __html: page.content }} />
        </div>
      </article>
    </>
  );
}
