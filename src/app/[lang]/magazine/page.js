import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export const revalidate = 60; // Revalidate every minute

export const metadata = {
  title: 'Web Magazines & Éditions Spéciales | A FOLUKU TV',
  description: 'Découvrez nos reportages longs formats et éditions spéciales.',
};

export default async function MagazineKioskPage({ params }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang;

  // Fetch articles marked as web_magazine
  const { data: magazines, error } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .contains('seo_metadata', { article_format: 'web_magazine' })
    .order('pub_date', { ascending: false });

  const getTitle = (article) => (lang === 'bsh' && article.title_bsh) ? article.title_bsh : article.title;
  const getDesc = (article) => (lang === 'bsh' && article.hook_bsh) ? article.hook_bsh : article.description;

  return (
    <div className="magazine-layout" style={{ backgroundColor: '#0f172a', minHeight: '100vh', color: '#f8fafc', paddingBottom: '80px' }}>
      
      {/* Header Éditorial */}
      <header style={{ 
        padding: '100px 20px 60px', 
        textAlign: 'center', 
        background: 'linear-gradient(to bottom, #020617, #0f172a)',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <span style={{ 
            color: '#c026d3', 
            textTransform: 'uppercase', 
            letterSpacing: '3px', 
            fontSize: '0.85rem', 
            fontWeight: 'bold',
            display: 'block',
            marginBottom: '15px'
          }}>Les formats longs</span>
          <h1 style={{ 
            fontFamily: 'var(--font-heading)', 
            fontSize: '4.5rem', 
            color: '#ffffff', 
            marginBottom: '25px',
            lineHeight: '1.1',
            textShadow: '0 4px 20px rgba(0,0,0,0.5)'
          }}>
            Le Magazine
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#94a3b8', lineHeight: '1.6' }}>
            Prenez le temps de lire. Plongez dans nos enquêtes, nos dossiers exclusifs et nos éditions spéciales au format immersif.
          </p>
        </div>
      </header>

      <div className="container" style={{ padding: '60px 20px' }}>
        {(!magazines || magazines.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '100px 20px' }}>
            <i className="fas fa-gem" style={{ fontSize: '4rem', color: '#334155', marginBottom: '20px' }}></i>
            <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)' }}>Prochainement...</h2>
            <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Nos numéros spéciaux sont en cours de rédaction.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '80px' }}>
            {magazines.map((mag, index) => {
              // Alternance gauche/droite pour un look asymétrique premium
              const isEven = index % 2 === 0;
              return (
                <article key={mag.id} style={{ 
                  display: 'flex', 
                  flexDirection: isEven ? 'row' : 'row-reverse',
                  gap: '40px',
                  alignItems: 'center',
                  background: 'rgba(30, 41, 59, 0.4)',
                  borderRadius: '24px',
                  padding: '30px',
                  border: '1px solid rgba(255,255,255,0.05)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }} className="magazine-hero-card">
                  
                  {/* Image large */}
                  <div style={{ flex: '1.5', height: '500px', borderRadius: '16px', overflow: 'hidden', position: 'relative' }} className="image-wrapper">
                    <div style={{ 
                      position: 'absolute', inset: 0, 
                      backgroundImage: mag.image_url ? `url(${mag.image_url})` : 'url(https://images.unsplash.com/photo-1499750310107-5fef28a66643)',
                      backgroundSize: 'cover', 
                      backgroundPosition: 'center',
                      transition: 'transform 0.7s cubic-bezier(0.25, 1, 0.5, 1)'
                    }} className="mag-bg-image"></div>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,23,42,0.8) 0%, transparent 40%)' }}></div>
                  </div>

                  {/* Contenu */}
                  <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '20px', padding: isEven ? '0 20px 0 0' : '0 0 0 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <span style={{ 
                        padding: '6px 12px', 
                        background: 'rgba(192, 38, 211, 0.1)', 
                        color: '#f0abfc',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        border: '1px solid rgba(192, 38, 211, 0.3)'
                      }}>Édition Spéciale</span>
                      <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
                        <i className="far fa-clock"></i> {new Date(mag.pub_date).toLocaleDateString(lang === 'bsh' ? 'bs-BA' : 'fr-FR', { month: 'long', year: 'numeric' })}
                      </span>
                    </div>

                    <h2 style={{ 
                      fontSize: '2.5rem', 
                      fontFamily: 'var(--font-heading)',
                      lineHeight: '1.2',
                      color: '#ffffff'
                    }}>
                      <Link href={`/${lang}/article/${mag.slug}`} style={{ color: 'inherit', textDecoration: 'none' }} className="hover-text-primary">
                        {getTitle(mag)}
                      </Link>
                    </h2>

                    <p style={{ 
                      fontSize: '1.1rem', 
                      lineHeight: '1.7', 
                      color: '#94a3b8' 
                    }}>
                      {(getDesc(mag) || '').substring(0, 200)}...
                    </p>

                    <div style={{ marginTop: '20px' }}>
                      <Link href={`/${lang}/article/${mag.slug}`} style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: '#ffffff',
                        color: '#0f172a',
                        padding: '12px 28px',
                        borderRadius: '30px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        textDecoration: 'none',
                        transition: 'all 0.3s ease'
                      }} className="read-mag-btn">
                        Commencer la lecture <i className="fas fa-arrow-right"></i>
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .hover-text-primary:hover {
          color: #c026d3 !important;
        }
        .magazine-hero-card {
          transition: transform 0.4s ease, border-color 0.4s ease;
        }
        .magazine-hero-card:hover {
          border-color: rgba(192, 38, 211, 0.4) !important;
          transform: translateY(-5px);
        }
        .magazine-hero-card:hover .mag-bg-image {
          transform: scale(1.05);
        }
        .read-mag-btn:hover {
          background: #c026d3 !important;
          color: white !important;
          transform: translateX(5px);
          box-shadow: 0 10px 20px rgba(192, 38, 211, 0.3);
        }
        @media (max-width: 900px) {
          .magazine-hero-card {
            flex-direction: column !important;
            padding: 20px !important;
          }
          .image-wrapper {
            width: 100%;
            height: 300px !important;
          }
        }
      `}} />
    </div>
  );
}
