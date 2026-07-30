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
    <main className="container" style={{ paddingTop: '120px', paddingBottom: '60px', minHeight: '60vh', maxWidth: '800px', margin: '0 auto' }}>
      <article>
        <header style={{ marginBottom: '40px' }}>
          <h1 style={{ fontFamily: 'var(--font-heading, "Playfair Display", serif)', fontSize: '42px', color: '#111827', marginBottom: '20px', lineHeight: '1.2' }}>
            {page.title}
          </h1>
        </header>

        <div 
          className="article-content"
          style={{ fontSize: '18px', lineHeight: '1.8', color: '#374151' }}
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </article>
    </main>
  );
}
