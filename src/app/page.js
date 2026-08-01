import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import NewsletterForm from '@/components/NewsletterForm';

export const revalidate = 60; // Revalidate every minute

export default async function Home() {
  // Fetch latest articles
  const { data: articles, error } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .order('pub_date', { ascending: false })
    .limit(10);

  // Fetch Most Read Articles (using likes_count as proxy)
  const { data: mostReadArticles } = await supabase
    .from('articles')
    .select('title, slug, image_url, category, likes_count')
    .eq('status', 'published')
    .order('likes_count', { ascending: false })
    .limit(4);

  return (
    <>
      {/* HERO CAROUSEL (Simplified) */}
      <section className="hero-carousel" id="heroCarousel">
        <div className="carousel-container">
          {articles && articles.slice(0, 3).map((article, index) => (
            <div key={article.id} className={`carousel-slide${index === 0 ? ' active' : ''}`}>
              <img src={article.image_url || 'https://images.unsplash.com/photo-1620287341056-49a2f1ab2fdc?q=80&w=800&auto=format&fit=crop'} alt={article.title} className="carousel-image" />
              <div className="carousel-overlay">
                <div className="container">
                  <span className="badge badge-red">À LA UNE</span>
                  <h1 className="carousel-title">{article.title}</h1>
                  <p className="carousel-excerpt">{(article.description || '').substring(0, 150) + '...'}</p>
                  <Link href={`/article/${article.slug}`} className="btn btn-primary">Lire l&apos;article</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {articles && articles.length > 1 && (
          <div className="carousel-indicators">
            {articles.slice(0, 3).map((_, index) => (
              <button key={index} className={`indicator${index === 0 ? ' active' : ''}`} aria-label={`Slide ${index + 1}`}></button>
            ))}
          </div>
        )}
      </section>

      {/* FLASH NEWS TICKER */}
      <section className="flash-ticker" id="flashTicker">
        <div className="ticker-container">
          <div className="ticker-label">
            <i className="fas fa-bolt"></i>
            <span>FLASH INFO</span>
          </div>
          <div className="ticker-content">
            <div className="ticker-track">
              {articles && articles.map((article, i) => (
                <span key={i} className="ticker-item">🔥 {article.title}</span>
              ))}
              {articles && articles.map((article, i) => (
                <span key={`dup-${i}`} className="ticker-item">🔥 {article.title}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT AREA */}
      <section className="section" style={{ padding: '40px 0' }}>
        <div className="article-layout-wrapper" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px', display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
          
          {/* Left Sidebar: Latest Articles */}
          <aside className="sidebar-latest" style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <div style={{ width: '4px', height: '24px', backgroundColor: 'var(--color-primary)' }}></div>
              <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', margin: 0, textTransform: 'uppercase' }}>Derniers articles</h3>
            </div>
            
            <div className="sidebar-list">
            {articles && articles.slice(0, 4).map((item) => (
              <Link href={`/article/${item.slug}`} key={item.slug} style={{ display: 'flex', flexDirection: 'column', gap: '10px', textDecoration: 'none', color: 'inherit' }} className="sidebar-article">
                <div style={{ height: '140px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f3f4f6' }}>
                  <img src={item.image_url || 'https://images.unsplash.com/photo-1620287341056-49a2f1ab2fdc?q=80&w=400&auto=format&fit=crop'} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }} className="hover-zoom" />
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--color-primary)', textTransform: 'uppercase' }}>{item.category}</span>
                  <h4 style={{ fontSize: '0.95rem', margin: '5px 0 0 0', lineHeight: '1.4', fontWeight: '600' }} className="hover-color">{item.title}</h4>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginTop: '5px' }}>{new Date(item.pub_date).toLocaleDateString('fr-FR')}</div>
                </div>
              </Link>
            ))}
            </div>
          </aside>

          {/* Center: Main Grid */}
          <div className="article-container" style={{ flex: 1, minWidth: 0 }}>
            <div className="section-header">
              <h2 className="section-title">À la une</h2>
              <Link href="/faits-divers" className="section-link">Voir tout <i className="fas fa-arrow-right"></i></Link>
            </div>

            <div className="featured-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px' }}>
              {error && <p>Erreur lors du chargement des articles.</p>}
              {articles && articles.slice(0, 6).map(article => (
                <article key={article.id} className="card article-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div className="card-image-wrapper">
                    <img src={article.image_url || 'https://images.unsplash.com/photo-1620287341056-49a2f1ab2fdc?q=80&w=600&auto=format&fit=crop'} alt={article.title} className="card-image" loading="lazy" style={{ height: '200px', objectFit: 'cover', width: '100%' }} />
                    <span className="badge card-badge">{article.category}</span>
                  </div>
                  <div className="card-body" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h3 className="card-title">
                      <Link href={`/article/${article.slug}`}>{article.title}</Link>
                    </h3>
                    <div className="card-meta" style={{ marginTop: 'auto' }}>
                      <span><i className="far fa-clock"></i> {new Date(article.pub_date).toLocaleDateString('fr-FR')}</span>
                      <span style={{ marginLeft: '10px' }}><i className="fas fa-user"></i> {article.author}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Right Sidebar: Most Read Articles */}
          <aside className="sidebar-popular" style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <div style={{ width: '4px', height: '24px', backgroundColor: '#eab308' }}></div>
              <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', margin: 0, textTransform: 'uppercase' }}>Les plus lus</h3>
            </div>
            
            <div className="sidebar-list">
            {mostReadArticles && mostReadArticles.map((item, index) => (
              <Link href={`/article/${item.slug}`} key={item.slug} style={{ display: 'flex', alignItems: 'center', gap: '15px', textDecoration: 'none', color: 'inherit' }} className="sidebar-article">
                <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#f3f4f6', lineHeight: '1', minWidth: '40px', textAlign: 'center', fontFamily: 'var(--font-heading)' }}>
                  {index + 1}
                </div>
                <div>
                  <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#eab308', textTransform: 'uppercase' }}>{item.category}</span>
                  <h4 style={{ fontSize: '0.9rem', margin: '3px 0 0 0', lineHeight: '1.4', fontWeight: '600' }} className="hover-color">{item.title}</h4>
                </div>
              </Link>
            ))}
            </div>
          </aside>

        </div>
      </section>

      {/* NEWSLETTER SECTION */}
      <section className="section newsletter-section" id="newsletter">
        <div className="container-narrow">
          <div className="newsletter-box" style={{ padding: '40px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
            <NewsletterForm />
          </div>
        </div>
      </section>

      <style>{`
        /* Mobile First Layout */
        .article-layout-wrapper {
          flex-direction: column;
        }
        
        .article-container {
          order: 1; /* Main content always first on mobile */
          width: 100%;
        }

        .sidebar-latest {
          order: 2;
          width: 100% !important;
          position: static !important;
          margin-top: 40px;
        }

        .sidebar-popular {
          order: 3;
          width: 100% !important;
          position: static !important;
          margin-top: 40px;
        }
        
        .sidebar-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        /* Desktop Layout */
        @media (min-width: 1024px) {
          .article-layout-wrapper {
            flex-direction: row;
          }
          
          .article-container {
            order: 2; /* Center */
          }

          .sidebar-latest {
            order: 1; /* Left */
            width: 280px !important;
            position: sticky !important;
            margin-top: 0;
          }

          .sidebar-popular {
            order: 3; /* Right */
            width: 280px !important;
            position: sticky !important;
            margin-top: 0;
          }
          
          .sidebar-list {
            display: flex;
            flex-direction: column;
            gap: 15px;
          }
        }

        /* Hover Effects */
        .sidebar-article .hover-zoom {
          transition: transform 0.3s ease;
        }
        .sidebar-article:hover .hover-zoom {
          transform: scale(1.05);
        }
        .sidebar-article .hover-color {
          transition: color 0.2s ease;
        }
        .sidebar-article:hover .hover-color {
          color: var(--color-primary);
        }
      `}</style>
    </>
  );
}
