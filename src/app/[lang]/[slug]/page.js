import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import ContactForm from '@/components/ContactForm';

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
    <div style={{ backgroundColor: '#fafafa', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Hero Section */}
      <section style={{ 
        padding: '160px 20px 80px', 
        background: 'linear-gradient(135deg, var(--color-dark) 0%, #333333 100%)',
        color: 'white',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle background pattern */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          opacity: 0.05,
          backgroundImage: 'radial-gradient(var(--color-primary) 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}></div>

        <div className="container-narrow" style={{ position: 'relative', zIndex: 1, maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ 
            display: 'inline-block',
            padding: '6px 16px',
            backgroundColor: 'rgba(255, 215, 0, 0.1)',
            color: 'var(--color-primary)',
            borderRadius: '20px',
            fontSize: '0.875rem',
            fontWeight: '600',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            marginBottom: '20px'
          }}>
            Culture Média News
          </div>
          <h1 style={{ 
            fontSize: 'clamp(2.5rem, 5vw, 4rem)', 
            fontFamily: 'var(--font-heading)',
            fontWeight: '800',
            lineHeight: '1.2',
            margin: '0',
            color: '#ffffff',
            letterSpacing: '-1px'
          }}>
            {page.title}
          </h1>
        </div>
      </section>

      {/* Content Section */}
      <article className="container-narrow" style={{ 
        maxWidth: '1000px', 
        margin: '-40px auto 0', 
        position: 'relative',
        zIndex: 10,
        padding: '0 20px' 
      }}>
        <div style={{ 
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: 'clamp(30px, 5vw, 60px)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
          border: '1px solid rgba(0,0,0,0.03)'
        }}>
          
          <div 
            className="modern-page-content" 
            style={{ 
              fontSize: '1.125rem', 
              lineHeight: '1.9', 
              color: 'var(--color-gray-800)' 
            }}
            dangerouslySetInnerHTML={{ __html: page.content ? page.content.replace(/&nbsp;/g, ' ') : '' }} 
          />

          {slug === 'contact' && <ContactForm />}
        </div>
      </article>

      {/* Inject custom CSS for the HTML content coming from DB */}
      <style>{`
        .modern-page-content {
          /* Default browser word wrapping handles this best */
        }
        .modern-page-content h2 {
          font-family: var(--font-heading);
          font-size: 2rem;
          font-weight: 700;
          color: var(--color-dark);
          margin: 2.5rem 0 1.2rem;
          line-height: 1.3;
        }
        .modern-page-content h3 {
          font-family: var(--font-heading);
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--color-dark);
          margin: 2rem 0 1rem;
          line-height: 1.4;
        }
        .modern-page-content p {
          margin-bottom: 1.5rem;
          color: #4b5563;
          white-space: pre-wrap;
        }
        .modern-page-content a {
          color: var(--color-primary-dark);
          font-weight: 600;
          text-decoration: underline;
          text-decoration-thickness: 2px;
          text-underline-offset: 4px;
        }
        .modern-page-content a:hover {
          color: var(--color-dark);
        }
        .modern-page-content ul {
          margin-bottom: 1.5rem;
          padding-left: 1.5rem;
        }
        .modern-page-content li {
          margin-bottom: 0.5rem;
          color: #4b5563;
        }
        .modern-page-content strong {
          color: var(--color-dark);
          font-weight: 600;
        }
        .modern-page-content em {
          font-style: italic;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}
