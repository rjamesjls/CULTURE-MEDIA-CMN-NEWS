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

  // Fetch articles, categories and banners in parallel
  const [
    { data: articles, error },
    { data: mostReadArticles },
    { data: categoriesList },
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
      .limit(5),
    supabase
      .from('categories')
      .select('id, name, slug')
      .order('id', { ascending: true }),
    getActiveBanners('header'),
    getActiveBanners('in_feed'),
    getActiveBanners('sidebar'),
  ]);

  const getTitle = (article) => (lang === 'bsh' && article.title_bsh) ? article.title_bsh : article.title;
  const getDesc = (article) => (lang === 'bsh' && article.hook_bsh) ? article.hook_bsh : article.description;

  return (
    <>
      {/* 1. APP HORIZONTAL CATEGORY PILLS BAR (Touch-scrollable on mobile) */}
      <div className="mobile-app-pills-bar">
        <div className="mobile-pills-track">
          <Link href={`/${lang}`} className="mobile-pill active">
            <span className="pill-active-dot"></span>
            <span>À la une</span>
          </Link>
          <Link href={`/${lang}/radio`} className="mobile-pill radio-pill">
            <span className="live-pulse-dot"></span>
            <span>📻 Webradio Live</span>
          </Link>
          <Link href={`/${lang}/faits-divers`} className="mobile-pill">
            <span>🚨 Faits divers</span>
          </Link>
          {(categoriesList || []).map((cat) => (
            <Link key={cat.id} href={`/${lang}/category/${cat.slug}`} className="mobile-pill">
              <span>{cat.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* 2. HERO CAROUSEL INTERACTIF */}
      <div className="app-hero-container">
        <HeroCarousel articles={articles || []} dict={dict} lang={lang} />
      </div>

      {/* 3. FLASH NEWS TICKER */}
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

      {/* 4. AD BANNER: HEADER */}
      <div className="app-ad-wrapper" style={{ maxWidth: '1400px', margin: '0 auto', padding: '12px 16px 0 16px' }}>
        <AdBannerCarousel placement="header" initialBanners={headerBanners} />
      </div>

      {/* 5. WEBRADIO LIVE MINI-CARD (Mobile App Widget) */}
      <div className="mobile-webradio-widget">
        <Link href={`/${lang}/radio`} className="webradio-app-card">
          <div className="webradio-badge-col">
            <div className="webradio-status">
              <span className="webradio-live-dot"></span>
              <span className="webradio-live-text">DIRECT RADIO</span>
            </div>
            <div className="webradio-name">AFOLUKU Radio • Musique & Infos</div>
          </div>
          <div className="webradio-play-button">
            <i className="fas fa-play"></i>
            <span>Écouter</span>
          </div>
        </Link>
      </div>

      {/* 6. DERNIÈRES MINUTES (SWIPEABLE HORIZONTAL STORY CAROUSEL - MOBILE ONLY) */}
      <section className="mobile-swipe-section">
        <div className="mobile-section-header">
          <div className="mobile-section-title-wrap">
            <span className="mobile-section-bar" style={{ backgroundColor: 'var(--color-primary)' }}></span>
            <h3 className="mobile-section-title">{dict.home.latest_news}</h3>
          </div>
          <span className="mobile-swipe-indicator">Glisser ➔</span>
        </div>
        
        <div className="mobile-swipe-container">
          {articles && articles.slice(0, 6).map((item) => (
            <Link href={`/${lang}/article/${item.slug}`} key={item.slug} className="mobile-swipe-card">
              <div className="swipe-img-box">
                <img src={item.image_url || 'https://images.unsplash.com/photo-1620287341056-49a2f1ab2fdc?q=80&w=400&auto=format&fit=crop'} alt={getTitle(item)} loading="lazy" />
                <span className="swipe-card-category">{item.category}</span>
              </div>
              <div className="swipe-card-info">
                <h4 className="swipe-card-headline">{getTitle(item)}</h4>
                <div className="swipe-card-time"><i className="far fa-clock"></i> {new Date(item.pub_date).toLocaleDateString(lang === 'bsh' ? 'bs-BA' : 'fr-FR')}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 7. MAIN CONTENT AREA */}
      <section className="section" style={{ padding: '20px 0 40px 0' }}>
        <div className="article-layout-wrapper" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 16px', display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
          
          {/* Left Sidebar: Latest Articles (Desktop Only) */}
          <aside className="sidebar-latest desktop-only-sidebar" style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '100px' }}>
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

          {/* Center: Main Grid / App Feed */}
          <div className="article-container" style={{ flex: 1, minWidth: 0 }}>
            <div className="section-header" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>🔥</span>
                <h2 className="section-title" style={{ margin: 0 }}>{dict.home.featured}</h2>
              </div>
              <Link href={`/${lang}/faits-divers`} className="section-link">{dict.home.view_all} <i className="fas fa-arrow-right"></i></Link>
            </div>

            <div className="featured-grid">
              {error && <p>{dict.home.error_loading}</p>}
              {articles && articles.slice(0, 6).map(article => (
                <article key={article.id} className="card article-card app-feed-card">
                  <div className="card-image-wrapper">
                    <img src={article.image_url || 'https://images.unsplash.com/photo-1620287341056-49a2f1ab2fdc?q=80&w=600&auto=format&fit=crop'} alt={getTitle(article)} className="card-image" loading="lazy" style={{ objectFit: 'cover', width: '100%' }} />
                    <span className="badge card-badge">{article.category}</span>
                  </div>
                  <div className="card-body">
                    <h3 className="card-title">
                      <Link href={`/${lang}/article/${article.slug}`}>{getTitle(article)}</Link>
                    </h3>
                    <div className="card-meta">
                      <span><i className="far fa-clock"></i> {new Date(article.pub_date).toLocaleDateString(lang === 'bsh' ? 'bs-BA' : 'fr-FR')}</span>
                      <span className="card-meta-author"><i className="fas fa-user"></i> {article.author}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* AD BANNER: IN FEED */}
            <div style={{ margin: '20px 0' }}>
              <AdBannerCarousel placement="in_feed" initialBanners={inFeedBanners} />
            </div>
          </div>

          {/* Right Sidebar / Mobile Leaderboard: Most Read Articles */}
          <aside className="sidebar-popular" style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <div style={{ width: '4px', height: '24px', backgroundColor: '#eab308', borderRadius: '2px' }}></div>
              <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', margin: 0, textTransform: 'uppercase' }}>{dict.home.most_read}</h3>
            </div>
            
            <div className="leaderboard-app-list">
            {mostReadArticles && mostReadArticles.map((item, index) => (
              <Link href={`/${lang}/article/${item.slug}`} key={item.slug} className="leaderboard-item">
                <div className={`leaderboard-rank rank-${index + 1}`}>
                  {index + 1}
                </div>
                <div className="leaderboard-details">
                  <span className="leaderboard-category">{item.category}</span>
                  <h4 className="leaderboard-title">{getTitle(item)}</h4>
                  <div className="leaderboard-meta">{new Date(item.pub_date).toLocaleDateString(lang === 'bsh' ? 'bs-BA' : 'fr-FR')}</div>
                </div>
                {item.image_url && (
                  <div className="leaderboard-thumb">
                    <img src={item.image_url} alt="" />
                  </div>
                )}
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
          <div className="newsletter-box app-newsletter-card">
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
           MOBILE APP DESIGN ENHANCEMENTS
           =================================================== */

        /* 1. HORIZONTAL CATEGORY PILLS BAR */
        .mobile-app-pills-bar {
          display: none;
          background: #fff;
          border-bottom: 1px solid #f1f5f9;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 2px 10px rgba(0,0,0,0.03);
        }

        .mobile-pills-track {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
          -webkit-overflow-scrolling: touch;
        }

        .mobile-pills-track::-webkit-scrollbar {
          display: none;
        }

        .mobile-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
          text-decoration: none;
          color: #475569;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .mobile-pill:active {
          transform: scale(0.96);
        }

        .mobile-pill.active {
          background: #0f172a;
          color: #fff;
          border-color: #0f172a;
        }

        .pill-active-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #38bdf8;
        }

        .mobile-pill.radio-pill {
          background: linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%);
          border-color: #c7d2fe;
          color: #4338ca;
        }

        .live-pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ef4444;
          box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
          animation: pulseRed 1.8s infinite;
        }

        @keyframes pulseRed {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }

        /* 2. WEBRADIO MINI LIVE WIDGET */
        .mobile-webradio-widget {
          display: none;
          padding: 0 14px;
          margin: 12px 0 6px 0;
        }

        .webradio-app-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%);
          border: 1px solid rgba(129, 140, 248, 0.25);
          padding: 12px 16px;
          border-radius: 16px;
          text-decoration: none;
          color: #fff;
          box-shadow: 0 6px 20px rgba(15, 23, 42, 0.25);
        }

        .webradio-badge-col {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .webradio-status {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .webradio-live-dot {
          width: 7px;
          height: 7px;
          background: #22c55e;
          border-radius: 50%;
          box-shadow: 0 0 8px #22c55e;
        }

        .webradio-live-text {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1px;
          color: #86efac;
        }

        .webradio-name {
          font-size: 13px;
          font-weight: 700;
          color: #fff;
        }

        .webradio-play-button {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #facc15;
          color: #0f172a;
          padding: 8px 14px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 800;
          box-shadow: 0 4px 12px rgba(250, 204, 21, 0.4);
        }

        /* 3. MOBILE SWIPEABLE CAROUSEL: "DERNIÈRES MINUTES" */
        .mobile-swipe-section {
          display: none;
          padding: 18px 0 10px 0;
        }

        .mobile-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px 10px 16px;
        }

        .mobile-section-title-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .mobile-section-bar {
          width: 4px;
          height: 18px;
          border-radius: 2px;
        }

        .mobile-section-title {
          font-size: 1.1rem;
          font-weight: 800;
          margin: 0;
          text-transform: uppercase;
          font-family: var(--font-heading);
          color: #0f172a;
        }

        .mobile-swipe-indicator {
          font-size: 12px;
          font-weight: 700;
          color: #64748b;
        }

        .mobile-swipe-container {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding: 4px 16px 14px 16px;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }

        .mobile-swipe-container::-webkit-scrollbar {
          display: none;
        }

        .mobile-swipe-card {
          flex: 0 0 240px;
          scroll-snap-align: start;
          background: #fff;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 15px rgba(0,0,0,0.04);
          text-decoration: none;
          color: inherit;
          display: flex;
          flex-direction: column;
        }

        .swipe-img-box {
          position: relative;
          height: 130px;
          background: #f1f5f9;
        }

        .swipe-img-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .swipe-card-category {
          position: absolute;
          top: 8px;
          left: 8px;
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(4px);
          color: #fff;
          font-size: 9px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 6px;
          text-transform: uppercase;
        }

        .swipe-card-info {
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .swipe-card-headline {
          font-size: 0.9rem;
          font-weight: 700;
          line-height: 1.35;
          margin: 0 0 8px 0;
          color: #1e293b;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .swipe-card-time {
          margin-top: auto;
          font-size: 11px;
          color: #94a3b8;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* 4. LEADERBOARD LIST ("LES PLUS LUS") */
        .leaderboard-app-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .leaderboard-item {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #fff;
          padding: 12px 14px;
          border-radius: 14px;
          border: 1px solid #f1f5f9;
          text-decoration: none;
          color: inherit;
          transition: all 0.2s ease;
        }

        .leaderboard-item:active {
          background: #f8fafc;
          transform: scale(0.99);
        }

        .leaderboard-rank {
          font-size: 1.6rem;
          font-weight: 900;
          line-height: 1;
          min-width: 30px;
          text-align: center;
          font-family: var(--font-heading);
          color: #94a3b8;
        }

        .leaderboard-rank.rank-1 { color: #f59e0b; }
        .leaderboard-rank.rank-2 { color: #64748b; }
        .leaderboard-rank.rank-3 { color: #d97706; }

        .leaderboard-details {
          flex: 1;
          min-width: 0;
        }

        .leaderboard-category {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          color: #d97706;
          display: block;
          margin-bottom: 2px;
        }

        .leaderboard-title {
          font-size: 0.88rem;
          font-weight: 700;
          line-height: 1.35;
          margin: 0 0 4px 0;
          color: #0f172a;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .leaderboard-meta {
          font-size: 11px;
          color: #94a3b8;
        }

        .leaderboard-thumb {
          width: 58px;
          height: 58px;
          border-radius: 10px;
          overflow: hidden;
          background: #e2e8f0;
          flex-shrink: 0;
        }

        .leaderboard-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* 5. APP FEED CARDS */
        .app-feed-card {
          border-radius: 16px !important;
          overflow: hidden !important;
          border: 1px solid #f1f5f9 !important;
          box-shadow: 0 4px 16px rgba(0,0,0,0.05) !important;
          background: #fff !important;
        }

        .app-feed-card:active {
          transform: scale(0.99);
        }

        .app-newsletter-card {
          padding: 30px 20px !important;
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%) !important;
          border-radius: 18px !important;
          border: 1px solid #e2e8f0 !important;
          box-shadow: 0 10px 25px rgba(0,0,0,0.04) !important;
        }

        /* ===================================================
           RESPONSIVE BREAKPOINTS (APP VS DESKTOP)
           =================================================== */
        @media (max-width: 768px) {
          .mobile-app-pills-bar {
            display: block;
          }

          .mobile-webradio-widget {
            display: block;
          }

          .mobile-swipe-section {
            display: block;
          }

          .desktop-only-sidebar {
            display: none !important;
          }

          .app-hero-container {
            padding: 10px 14px 0 14px;
          }

          .hero-carousel {
            height: 380px !important;
            border-radius: 18px !important;
            overflow: hidden !important;
            box-shadow: 0 10px 30px rgba(0,0,0,0.15) !important;
          }

          .carousel-overlay {
            padding: 18px 16px 24px 16px !important;
            border-radius: 0 0 18px 18px !important;
          }

          .carousel-overlay .badge {
            font-size: 10px !important;
            padding: 3px 8px !important;
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
            border-radius: 9999px !important;
          }

          .carousel-indicators {
            bottom: 8px !important;
          }

          .featured-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }

          .featured-grid .article-card .card-image {
            height: 120px;
          }

          .featured-grid .article-card .card-body {
            padding: 10px 10px;
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

          .article-layout-wrapper {
            flex-direction: column !important;
            gap: 20px !important;
          }

          .article-container {
            width: 100% !important;
          }

          .sidebar-popular {
            width: 100% !important;
            position: static !important;
            margin-top: 10px;
          }
        }

        @media (min-width: 769px) and (max-width: 1023px) {
          .mobile-app-pills-bar {
            display: block;
          }
          .mobile-webradio-widget {
            display: block;
          }
          .featured-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
          .article-layout-wrapper {
            flex-direction: column;
          }
        }

        /* Desktop Layout (min-width: 1024px) */
        @media (min-width: 1024px) {
          .featured-grid {
            display: grid;
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

          .article-layout-wrapper {
            flex-direction: row;
          }
          
          .article-container {
            order: 2;
          }

          .sidebar-latest {
            order: 1;
            width: 280px !important;
            position: sticky !important;
          }

          .sidebar-popular {
            order: 3;
            width: 280px !important;
            position: sticky !important;
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
