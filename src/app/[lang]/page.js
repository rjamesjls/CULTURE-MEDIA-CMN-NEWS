import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import NewsletterForm from '@/components/NewsletterForm';
import { getDictionary } from '@/i18n/dictionaries';
import AdBannerCarousel from '@/components/ads/AdBannerCarousel';
import HeroCarousel from '@/components/HeroCarousel';
import { getActiveBanners } from '@/lib/ads';

export const revalidate = 60; // Revalidate every minute

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang;
  return {
    alternates: {
      canonical: `/${lang}`,
      languages: {
        'fr': '/fr',
        'bsh': '/bsh',
      },
    },
  };
}

export default async function Home({ params }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang;
  const dict = await getDictionary(lang);

  // Fetch articles and banners in parallel
  const [
    { data: articles, error },
    { data: mostReadArticles },
    headerBanners,
    inFeedBanners,
    sidebarBanners,
  ] = await Promise.all([
    supabase
      .from('articles')
      .select('*')
      .eq('status', 'published')
      .order('pub_date', { ascending: false })
      .limit(10),
    supabase
      .from('articles')
      .select('*')
      .eq('status', 'published')
      .order('likes_count', { ascending: false })
      .limit(4),
    getActiveBanners('header'),
    getActiveBanners('in_feed'),
    getActiveBanners('sidebar'),
  ]);

  const getTitle = (article) => (lang === 'bsh' && article.title_bsh) ? article.title_bsh : article.title;
  const getDesc = (article) => (lang === 'bsh' && article.hook_bsh) ? article.hook_bsh : article.description;

  return (
    <>
      {/* HERO CAROUSEL INTERACTIF (Auto-rotation & changement manuel) */}
      <HeroCarousel articles={articles || []} dict={dict} lang={lang} />

      {/* FLASH NEWS TICKER */}
      <section className="flash-ticker" id="flashTicker">
        <div className="ticker-container">
          <div className="ticker-label">
            <i className="fas fa-bolt"></i>
            <span>{dict.home.flash_info}</span>
          </div>
          <div className="ticker-content">
            <div className="ticker-track">
              {articles && articles.map((article, i) => (
                <span key={i} className="ticker-item">🔥 {getTitle(article)}</span>
              ))}
              {articles && articles.map((article, i) => (
                <span key={`dup-${i}`} className="ticker-item">🔥 {getTitle(article)}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* AD BANNER: HEADER */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '15px 20px 0 20px' }}>
        <AdBannerCarousel placement="header" initialBanners={headerBanners} />
      </div>

      {/* MAIN CONTENT AREA */}
      <section className="section" style={{ padding: '40px 0' }}>
        <div className="article-layout-wrapper" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px', display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
          
          {/* Left Sidebar: Latest Articles */}
          <aside className="sidebar-latest" style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <div style={{ width: '4px', height: '24px', backgroundColor: 'var(--color-primary)' }}></div>
              <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', margin: 0, textTransform: 'uppercase' }}>{dict.home.latest_news}</h3>
            </div>
            
            <div className="sidebar-list">
            {articles && articles.slice(0, 4).map((item) => (
              <Link href={`/${lang}/article/${item.slug}`} key={item.slug} style={{ display: 'flex', flexDirection: 'column', gap: '10px', textDecoration: 'none', color: 'inherit' }} className="sidebar-article">
                <div style={{ height: '140px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f3f4f6' }}>
                  <img src={item.image_url || 'https://images.unsplash.com/photo-1620287341056-49a2f1ab2fdc?q=80&w=400&auto=format&fit=crop'} alt={getTitle(item)} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }} className="hover-zoom" />
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--color-primary)', textTransform: 'uppercase' }}>{item.category}</span>
                  <h4 style={{ fontSize: '0.95rem', margin: '5px 0 0 0', lineHeight: '1.4', fontWeight: '600' }} className="hover-color">{getTitle(item)}</h4>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginTop: '5px' }}>{new Date(item.pub_date).toLocaleDateString(lang === 'bsh' ? 'bs-BA' : 'fr-FR')}</div>
                </div>
              </Link>
            ))}
            </div>
          </aside>

          {/* Center: Main Grid */}
          <div className="article-container" style={{ flex: 1, minWidth: 0 }}>
            <div className="section-header">
              <h2 className="section-title">{dict.home.featured}</h2>
              <Link href={`/${lang}/faits-divers`} className="section-link">{dict.home.view_all} <i className="fas fa-arrow-right"></i></Link>
            </div>

            <div className="featured-grid">
              {error && <p>{dict.home.error_loading}</p>}
              {articles && articles.slice(0, 6).map(article => (
                <article key={article.id} className="card article-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div className="card-image-wrapper">
                    <img src={article.image_url || 'https://images.unsplash.com/photo-1620287341056-49a2f1ab2fdc?q=80&w=600&auto=format&fit=crop'} alt={getTitle(article)} className="card-image" loading="lazy" style={{ objectFit: 'cover', width: '100%' }} />
                    <span className="badge card-badge">{article.category}</span>
                  </div>
                  <div className="card-body" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h3 className="card-title">
                      <Link href={`/${lang}/article/${article.slug}`}>{getTitle(article)}</Link>
                    </h3>
                    <div className="card-meta" style={{ marginTop: 'auto' }}>
                      <span><i className="far fa-clock"></i> {new Date(article.pub_date).toLocaleDateString(lang === 'bsh' ? 'bs-BA' : 'fr-FR')}</span>
                      <span className="card-meta-author" style={{ marginLeft: '10px' }}><i className="fas fa-user"></i> {article.author}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* AD BANNER: IN FEED */}
            <AdBannerCarousel placement="in_feed" initialBanners={inFeedBanners} />
          </div>

          {/* Right Sidebar: Most Read Articles */}
          <aside className="sidebar-popular" style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <div style={{ width: '4px', height: '24px', backgroundColor: '#eab308' }}></div>
              <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', margin: 0, textTransform: 'uppercase' }}>{dict.home.most_read}</h3>
            </div>
            
            <div className="sidebar-list">
            {mostReadArticles && mostReadArticles.map((item, index) => (
              <Link href={`/${lang}/article/${item.slug}`} key={item.slug} style={{ display: 'flex', alignItems: 'center', gap: '15px', textDecoration: 'none', color: 'inherit' }} className="sidebar-article">
                <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#f3f4f6', lineHeight: '1', minWidth: '40px', textAlign: 'center', fontFamily: 'var(--font-heading)' }}>
                  {index + 1}
                </div>
                <div>
                  <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#eab308', textTransform: 'uppercase' }}>{item.category}</span>
                  <h4 style={{ fontSize: '0.9rem', margin: '3px 0 0 0', lineHeight: '1.4', fontWeight: '600' }} className="hover-color">{getTitle(item)}</h4>
                </div>
              </Link>
            ))}
            </div>

            {/* AD BANNER: SIDEBAR */}
            <AdBannerCarousel placement="sidebar" initialBanners={sidebarBanners} />
          </aside>

        </div>
      </section>

      {/* NEWSLETTER SECTION */}
      <section className="section newsletter-section" id="newsletter">
        <div className="container-narrow">
          <div className="newsletter-box" style={{ padding: '40px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
            <NewsletterForm 
              title={dict.nav.newsletter}
              description={dict.newsletter?.description || "Restez informé de nos derniers articles"}
              placeholder={dict.newsletter?.placeholder || "Votre adresse email"}
              buttonText={dict.newsletter?.buttonText || "S'abonner"}
              buttonSubmitting={dict.newsletter?.buttonSubmitting || "Inscription..."}
            />
          </div>
        </div>
      </section>

      <style>{`
        /* ===================================================
           HERO CAROUSEL - MOBILE OPTIMIZATION
           =================================================== */
        @media (max-width: 768px) {
          .hero-carousel {
            height: 380px !important;
          }
          .carousel-overlay {
            padding: 16px 14px 22px 14px !important;
          }
          .carousel-overlay .badge {
            font-size: 10px !important;
            padding: 2px 7px !important;
            margin-bottom: 6px !important;
          }
          .carousel-title {
            font-size: 1.25rem !important;
            line-height: 1.3 !important;
            margin-bottom: 6px !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 2 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
          }
          .carousel-excerpt {
            font-size: 0.82rem !important;
            line-height: 1.35 !important;
            margin-bottom: 10px !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 2 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
          }
          .carousel-overlay .btn {
            padding: 6px 14px !important;
            font-size: 12px !important;
          }
          .carousel-indicators {
            bottom: 8px !important;
          }
        }

        /* ===================================================
           ARTICLES À LA UNE (FEATURED GRID) - 2 ARTICLES SUR MOBILE
           =================================================== */
        .featured-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .featured-grid .article-card .card-image {
          height: 120px;
        }

        .featured-grid .article-card .card-body {
          padding: 10px 8px;
        }

        .featured-grid .article-card .card-title {
          font-size: 0.88rem;
          line-height: 1.35;
          margin-bottom: 6px;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .featured-grid .article-card .card-meta {
          font-size: 0.68rem;
          color: #64748b;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .featured-grid .card-meta-author {
          display: none;
        }

        .featured-grid .card-badge {
          font-size: 9.5px;
          padding: 2px 6px;
        }

        @media (min-width: 640px) {
          .featured-grid .article-card .card-image {
            height: 160px;
          }
          .featured-grid .card-meta-author {
            display: inline-block;
          }
        }

        @media (min-width: 1024px) {
          .featured-grid {
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 30px;
          }
          .featured-grid .article-card .card-image {
            height: 200px;
          }
          .featured-grid .article-card .card-body {
            padding: var(--space-4);
          }
          .featured-grid .article-card .card-title {
            font-size: 1.15rem;
            line-height: 1.4;
            -webkit-line-clamp: 2;
          }
          .featured-grid .article-card .card-meta {
            font-size: var(--text-sm);
          }
          .featured-grid .card-badge {
            font-size: var(--text-xs);
            padding: var(--space-1) var(--space-3);
          }
        }

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
