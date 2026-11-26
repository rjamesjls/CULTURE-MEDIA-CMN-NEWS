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
      className="hero-carousel hero-rectangle-frame"
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
                transition: 'opacity 0.6s ease-in-out',
              }}
            >
              {/* Photo de l'article dans son cadre rectangle */}
              <div className="hero-img-box">
                <img
                  src={
                    article.image_url ||
                    'https://images.unsplash.com/photo-1620287341056-49a2f1ab2fdc?q=80&w=1200&auto=format&fit=crop'
                  }
                  alt={getTitle(article)}
                  className="carousel-image"
                />
              </div>

              {/* Superposition du titre et du texte avec dégradé soigné */}
              <div className="carousel-overlay">
                <div className="container hero-caption-container">
                  <div className="hero-badge-wrap">
                    <span className="badge badge-red">
                      {article.category || dict.home?.headline || 'À LA UNE'}
                    </span>
                  </div>

                  <Link href={`/${lang}/article/${article.slug}`} className="hero-title-link">
                    <h2 className="carousel-title">{getTitle(article)}</h2>
                  </Link>

                  {/* Le texte (chapeau / description) */}
                  <p className="carousel-excerpt">
                    {(getDesc(article) || '').substring(0, 150) + '...'}
                  </p>

                  <div className="hero-actions-row">
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
        .hero-rectangle-frame {
          position: relative;
          width: 100%;
          border-radius: 20px;
          overflow: hidden;
          background: #0f172a;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .hero-img-box {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        .hero-img-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          transition: transform 0.6s ease;
        }

        .hero-rectangle-frame:hover .hero-img-box img {
          transform: scale(1.02);
        }

        .carousel-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(
            180deg,
            rgba(0, 0, 0, 0) 0%,
            rgba(15, 23, 42, 0.3) 25%,
            rgba(15, 23, 42, 0.85) 65%,
            rgba(15, 23, 42, 0.98) 100%
          );
          padding: 32px 24px 34px 24px;
          color: #fff;
          z-index: 10;
        }

        .hero-caption-container {
          max-width: 900px;
          margin: 0;
          padding: 0;
        }

        .hero-badge-wrap {
          margin-bottom: 8px;
        }

        .hero-title-link {
          text-decoration: none;
          color: inherit;
        }

        .carousel-title {
          font-size: 1.85rem;
          font-weight: 800;
          line-height: 1.25;
          margin: 0 0 8px 0;
          color: #ffffff;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          transition: color 0.2s ease;
        }

        .hero-title-link:hover .carousel-title {
          color: #fca5a5;
        }

        .carousel-excerpt {
          font-size: 0.95rem;
          color: #f1f5f9;
          line-height: 1.45;
          margin: 0 0 14px 0;
          max-width: 780px;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .hero-actions-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .hero-btn-read {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 18px;
          font-size: 13px;
          font-weight: 700;
          border-radius: 9999px;
          box-shadow: 0 4px 14px rgba(220, 38, 38, 0.4);
        }

        .carousel-indicators {
          position: absolute;
          bottom: 14px;
          right: 24px;
          display: flex;
          align-items: center;
          gap: 6px;
          z-index: 20;
        }

        .indicator {
          width: 8px;
          height: 8px;
          border-radius: 4px;
          background-color: rgba(255, 255, 255, 0.4);
          border: none;
          cursor: pointer;
          padding: 0;
          transition: all 0.3s ease;
        }

        .indicator.active {
          width: 26px;
          background-color: #ef4444;
        }

        @media (max-width: 768px) {
          .hero-rectangle-frame {
            border-radius: 16px;
            height: 390px;
          }

          .carousel-overlay {
            padding: 16px 16px 26px 16px;
          }

          .carousel-title {
            font-size: 1.25rem;
            line-height: 1.3;
            margin-bottom: 6px;
          }

          .carousel-excerpt {
            font-size: 0.82rem;
            line-height: 1.35;
            margin-bottom: 10px;
          }

          .hero-btn-read {
            padding: 6px 14px;
            font-size: 12px;
          }

          .carousel-indicators {
            bottom: 10px;
            right: 16px;
          }
        }
      `}</style>
    </section>
  );
}
