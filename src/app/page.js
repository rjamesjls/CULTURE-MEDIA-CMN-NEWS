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
    .limit(7);

  return (
    <>
      {/* HERO CAROUSEL (Simplified) */}
      <section className="hero-carousel" id="heroCarousel">
        <div className="carousel-container">
          {articles && articles.slice(0, 3).map((article, index) => (
            <div key={article.id} className={`carousel-slide${index === 0 ? ' active' : ''}`}>
              <img src={article.image_url} alt={article.title} className="carousel-image" />
              <div className="carousel-overlay">
                <div className="container">
                  <span className="badge badge-red">À LA UNE</span>
                  <h1 className="carousel-title">{article.title}</h1>
                  <p className="carousel-excerpt">{(article.description || '').substring(0, 150) + '...'}</p>
                  <Link href={`/article/${article.slug}`} className="btn btn-primary">Lire l'article</Link>
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

      {/* À LA UNE SECTION */}
      <section className="section featured-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Derniers Articles</h2>
            <Link href="/faits-divers" className="section-link">Voir tout <i className="fas fa-arrow-right"></i></Link>
          </div>

          <div className="grid grid-4 featured-grid">
            {error && <p>Erreur lors du chargement des articles.</p>}
            {articles && articles.slice(3).map(article => (
              <article key={article.id} className="card article-card">
                <div className="card-image-wrapper">
                  <img src={article.image_url} alt={article.title} className="card-image" loading="lazy" style={{ height: '200px', objectFit: 'cover' }} />
                  <span className="badge card-badge">{article.category}</span>
                </div>
                <div className="card-body">
                  <h3 className="card-title">
                    <Link href={`/article/${article.slug}`}>{article.title}</Link>
                  </h3>
                  <div className="card-meta">
                    <span><i className="far fa-clock"></i> {new Date(article.pub_date).toLocaleDateString('fr-FR')}</span>
                    <span style={{ marginLeft: '10px' }}><i className="fas fa-user"></i> {article.author}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
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
    </>
  );
}
