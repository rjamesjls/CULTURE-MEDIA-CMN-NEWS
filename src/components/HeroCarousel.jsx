'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function HeroCarousel({ articles = [], dict = {}, lang = 'fr' }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  const slides = articles.slice(0, 5);

  const getTitle = (article) =>
    lang === 'bsh' && article.title_bsh ? article.title_bsh : article.title;
  const getDesc = (article) =>
    lang === 'bsh' && article.hook_bsh ? article.hook_bsh : article.description;

  // Auto-play timer (5.5s)
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5500);

    return () => clearInterval(timer);
  }, [slides.length, isPaused]);

  if (!slides || slides.length === 0) return null;

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50) {
      goToNext();
    } else if (diff < -50) {
      goToPrev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <section
      className="hero-carousel hero-triangle-stage"
      id="heroCarousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="carousel-container">
        {slides.map((article, index) => {
          const isActive = index === currentIndex;
          return (
            <div
              key={article.id || index}
              className={`carousel-slide${isActive ? ' active' : ''}`}
              style={{
                opacity: isActive ? 1 : 0,
                pointerEvents: isActive ? 'all' : 'none',
                transition: 'opacity 0.5s ease-in-out',
                position: isActive ? 'relative' : 'absolute',
                top: 0,
                left: 0,
                width: '100%',
              }}
            >
              <div className="hero-slide-wrapper">
                {/* 1. ENCADREMENT TRIANGULAIRE DE LA PHOTO */}
                <Link
                  href={`/${lang}/article/${article.slug}`}
                  className="hero-triangle-link"
                  title={getTitle(article)}
                >
                  <div className="hero-triangle-frame-outer">
                    <div className="hero-triangle-frame-inner">
                      <img
                        src={
                          article.image_url ||
                          'https://images.unsplash.com/photo-1620287341056-49a2f1ab2fdc?q=80&w=1200&auto=format&fit=crop'
                        }
                        alt={getTitle(article)}
                        className="hero-triangle-image"
                      />
                    </div>
                  </div>
                </Link>

                {/* 2. JUSTE EN BAS : CATÉGORIE, TITRE, DESCRIPTION ET BOUTON LIRE LA SUITE */}
                <div className="hero-content-below">
                  {/* Catégorie conservée */}
                  <div className="hero-badge-wrap">
                    <span className="badge badge-red hero-badge">
                      {article.category || dict.home?.headline || 'À LA UNE'}
                    </span>
                  </div>

                  {/* Le Titre */}
                  <Link href={`/${lang}/article/${article.slug}`} className="hero-title-link">
                    <h2 className="hero-article-title">{getTitle(article)}</h2>
                  </Link>

                  {/* La Description (texte de l'article) */}
                  <p className="hero-article-desc">
                    {(getDesc(article) || '').substring(0, 160) + '...'}
                  </p>

                  {/* Le Bouton Lire la suite */}
                  <div className="hero-action-wrap">
                    <Link
                      href={`/${lang}/article/${article.slug}`}
                      className="btn btn-primary hero-btn-read"
                    >
                      <span>{dict.home?.read_more || 'Lire la suite'}</span>
                      <i className="fas fa-arrow-right" style={{ marginLeft: '6px' }}></i>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Points indicateurs du carrousel */}
      {slides.length > 1 && (
        <div className="carousel-indicators">
          {slides.map((_, index) => {
            const isActive = index === currentIndex;
            return (
              <button
                key={index}
                type="button"
                className={`indicator${isActive ? ' active' : ''}`}
                aria-label={`Article ${index + 1}`}
                onClick={() => setCurrentIndex(index)}
              />
            );
          })}
        </div>
      )}

      <style jsx>{`
        .hero-triangle-stage {
          position: relative;
          width: 100%;
          background: linear-gradient(180deg, #0b1120 0%, #0f172a 100%);
          border-radius: 22px;
          overflow: hidden;
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.22);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 24px 20px 48px 20px;
        }

        .carousel-container {
          position: relative;
          width: 100%;
          min-height: 440px;
        }

        .carousel-slide {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .hero-slide-wrapper {
          width: 100%;
          max-width: 820px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        /* 1. Encadrement triangulaire */
        .hero-triangle-link {
          display: block;
          text-decoration: none;
          margin: 0 auto 16px auto;
          cursor: pointer;
        }

        .hero-triangle-frame-outer {
          width: 290px;
          height: 200px;
          margin: 0 auto;
          position: relative;
          background: linear-gradient(135deg, #ef4444 0%, #f59e0b 50%, #dc2626 100%);
          clip-path: polygon(50% 0%, 100% 100%, 0% 100%);
          padding: 4px;
          filter: drop-shadow(0 10px 24px rgba(239, 68, 68, 0.35));
          transition: transform 0.3s ease, filter 0.3s ease;
        }

        .hero-triangle-frame-outer:hover {
          transform: scale(1.03);
          filter: drop-shadow(0 14px 28px rgba(239, 68, 68, 0.55));
        }

        .hero-triangle-frame-inner {
          width: 100%;
          height: 100%;
          background: #0b0f19;
          clip-path: polygon(50% 0%, 100% 100%, 0% 100%);
          position: relative;
          overflow: hidden;
        }

        .hero-triangle-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 30%;
          display: block;
        }

        /* 2. Contenu en bas */
        .hero-content-below {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          width: 100%;
        }

        .hero-badge-wrap {
          margin-bottom: 8px;
        }

        .hero-badge {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.8px;
          padding: 4px 12px;
          border-radius: 9999px;
          box-shadow: 0 3px 10px rgba(220, 38, 38, 0.4);
        }

        .hero-title-link {
          text-decoration: none;
          color: inherit;
          max-width: 760px;
        }

        .hero-article-title {
          font-size: 1.55rem;
          font-weight: 800;
          line-height: 1.3;
          margin: 0 0 10px 0;
          color: #ffffff;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          transition: color 0.2s ease;
        }

        .hero-title-link:hover .hero-article-title {
          color: #fca5a5;
        }

        .hero-article-desc {
          font-size: 0.92rem;
          color: #cbd5e1;
          line-height: 1.45;
          margin: 0 0 16px 0;
          max-width: 680px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .hero-action-wrap {
          display: flex;
          justify-content: center;
        }

        .hero-btn-read {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 20px;
          font-size: 13px;
          font-weight: 700;
          border-radius: 9999px;
          box-shadow: 0 4px 14px rgba(220, 38, 38, 0.4);
          transition: transform 0.2s ease;
        }

        .hero-btn-read:hover {
          transform: translateY(-2px);
        }

        /* Indicateurs */
        .carousel-indicators {
          position: absolute;
          bottom: 14px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 6px;
          z-index: 20;
        }

        .indicator {
          width: 8px;
          height: 8px;
          border-radius: 4px;
          background-color: rgba(255, 255, 255, 0.35);
          border: none;
          cursor: pointer;
          padding: 0;
          transition: all 0.3s ease;
        }

        .indicator.active {
          width: 24px;
          background-color: #ef4444;
        }

        @media (max-width: 768px) {
          .hero-triangle-stage {
            padding: 16px 12px 38px 12px;
            border-radius: 18px;
          }

          .carousel-container {
            min-height: 420px;
          }

          .hero-triangle-frame-outer {
            width: 240px;
            height: 170px;
          }

          .hero-article-title {
            font-size: 1.18rem;
            line-height: 1.3;
            margin-bottom: 8px;
          }

          .hero-article-desc {
            font-size: 0.82rem;
            line-height: 1.35;
            margin-bottom: 12px;
          }

          .hero-btn-read {
            padding: 6px 16px;
            font-size: 12px;
          }

          .carousel-indicators {
            bottom: 10px;
          }
        }
      `}</style>
    </section>
  );
}
