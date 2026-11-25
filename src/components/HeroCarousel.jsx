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

  // Auto-play timer
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
      goToNext(); // Swipe left -> next
    } else if (diff < -50) {
      goToPrev(); // Swipe right -> prev
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <section
      className="hero-carousel"
      id="heroCarousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ position: 'relative' }}
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
              <img
                src={
                  article.image_url ||
                  'https://images.unsplash.com/photo-1620287341056-49a2f1ab2fdc?q=80&w=800&auto=format&fit=crop'
                }
                alt={getTitle(article)}
                className="carousel-image"
              />
              <div className="carousel-overlay">
                <div className="container">
                  <span className="badge badge-red">
                    {dict.home?.headline || 'À LA UNE'}
                  </span>
                  <h1 className="carousel-title">{getTitle(article)}</h1>
                  <p className="carousel-excerpt">
                    {(getDesc(article) || '').substring(0, 150) + '...'}
                  </p>
                  <Link
                    href={`/${lang}/article/${article.slug}`}
                    className="btn btn-primary"
                  >
                    {dict.home?.read_more || 'Lire la suite'}
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Prev / Next buttons */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            className="carousel-prev"
            onClick={goToPrev}
            aria-label="Article précédent"
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          <button
            type="button"
            className="carousel-next"
            onClick={goToNext}
            aria-label="Article suivant"
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </>
      )}

      {/* Indicators */}
      {slides.length > 1 && (
        <div className="carousel-indicators">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              className={`indicator${index === currentIndex ? ' active' : ''}`}
              aria-label={`Slide ${index + 1}`}
              onClick={() => setCurrentIndex(index)}
              style={{
                backgroundColor:
                  index === currentIndex
                    ? 'var(--color-primary, #dc2626)'
                    : 'rgba(255, 255, 255, 0.5)',
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
