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
          <div className="magazines-grid">
            {magazines.map((mag) => {
              return (
                <Link key={mag.id} href={`/${lang}/magazine/${mag.slug}`} style={{ display: 'block', textDecoration: 'none' }}>
                  <div style={{ 
                    width: '100%', 
                    aspectRatio: '3/4', 
                    borderRadius: '16px', 
                    overflow: 'hidden', 
                    position: 'relative',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    backgroundColor: '#1e293b'
                  }} className="magazine-poster">
                    
                    <div style={{ 
                      position: 'absolute', 
                      inset: 0, 
                      backgroundImage: mag.seo_metadata?.magazine_cover_url ? `url(${mag.seo_metadata.magazine_cover_url})` : (mag.image_url ? `url(${mag.image_url})` : 'url(https://images.unsplash.com/photo-1499750310107-5fef28a66643)'),
                      backgroundSize: 'cover', 
                      backgroundPosition: 'center',
                      transition: 'transform 0.4s ease'
                    }} className="mag-bg-image"></div>
                    
                    {/* Optionnel : un très léger gradient au survol, ou rien du tout */}
                    <div className="mag-poster-overlay" style={{ 
                      position: 'absolute', 
                      inset: 0, 
                      background: 'rgba(0,0,0,0)',
                      transition: 'background 0.3s ease'
                    }}></div>
                  </div>
                </Link>
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
