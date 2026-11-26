'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Heart, Share2, Download, ArrowRight } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { supabase } from '@/lib/supabase';
import { incrementLike } from '@/app/actions/analytics';

export default function HeroCarousel({ articles = [], dict = {}, lang = 'fr' }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  // Likes & Favorites state
  const [currentUser, setCurrentUser] = useState(null);
  const [userLikedIds, setUserLikedIds] = useState([]);
  const [articleLikes, setArticleLikes] = useState({});
  const [toastMessage, setToastMessage] = useState('');
  const toastTimeoutRef = useRef(null);

  const slides = articles.slice(0, 5);

  const getTitle = (article) =>
    lang === 'bsh' && article.title_bsh ? article.title_bsh : article.title;
  const getDesc = (article) =>
    lang === 'bsh' && article.hook_bsh ? article.hook_bsh : article.description;

  const showToast = (msg) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage('');
    }, 3200);
  };

  const getProxiedImageUrl = (url) => {
    if (!url) return 'https://images.unsplash.com/photo-1620287341056-49a2f1ab2fdc?q=80&w=1200&auto=format&fit=crop';
    if (url.startsWith('/') || url.startsWith('data:')) return url;
    return `/api/proxy-image?url=${encodeURIComponent(url)}`;
  };

  // Auth & Saved Likes Initialization
  useEffect(() => {
    try {
      const local = JSON.parse(localStorage.getItem('cmn_liked_articles') || '[]');
      setUserLikedIds(local);
    } catch {
      // ignore
    }

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCurrentUser(session.user);
          const { data: bms } = await supabase
            .from('bookmarks')
            .select('article_id')
            .eq('user_id', session.user.id);
          if (bms && bms.length > 0) {
            const bookmarkedIds = bms.map((b) => b.article_id);
            setUserLikedIds((prev) => Array.from(new Set([...prev, ...bookmarkedIds])));
          }
        }
      } catch (err) {
        console.error('Session error:', err);
      }
    };
    checkSession();
  }, []);

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

  const handleLike = async (article) => {
    const articleId = article.id;
    if (!articleId) return;

    const isAlreadyLiked = userLikedIds.includes(articleId);
    const currentCount = articleLikes[articleId] ?? (article.likes_count || 0);

    if (isAlreadyLiked) {
      // Unliking
      const updated = userLikedIds.filter((id) => id !== articleId);
      setUserLikedIds(updated);
      try {
        localStorage.setItem('cmn_liked_articles', JSON.stringify(updated));
      } catch {
        // ignore
      }
      setArticleLikes((prev) => ({
        ...prev,
        [articleId]: Math.max(0, currentCount - 1),
      }));

      if (currentUser) {
        await supabase
          .from('bookmarks')
          .delete()
          .match({ user_id: currentUser.id, article_id: articleId });
      }
      showToast('Article retiré de vos favoris');
    } else {
      // Liking
      const updated = [...userLikedIds, articleId];
      setUserLikedIds(updated);
      try {
        localStorage.setItem('cmn_liked_articles', JSON.stringify(updated));
      } catch {
        // ignore
      }
      setArticleLikes((prev) => ({
        ...prev,
        [articleId]: currentCount + 1,
      }));

      // Increment in database
      incrementLike(articleId).catch(console.error);

      // Save to bookmarks table so it appears in /profile
      if (currentUser) {
        try {
          await supabase
            .from('bookmarks')
            .upsert({ user_id: currentUser.id, article_id: articleId });
          showToast('❤️ Ajouté aux Favoris de votre compte !');
        } catch (err) {
          console.error(err);
          showToast('❤️ Article liké !');
        }
      } else {
        showToast('❤️ Liké ! Connectez-vous pour le retrouver dans vos Favoris.');
      }
    }
  };

  const handleShare = async (article) => {
    const title = getTitle(article);
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}/${lang}/article/${article.slug}`
        : `/article/${article.slug}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: getDesc(article) || title,
          url,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          copyToClipboard(url);
        }
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      showToast('🔗 Lien copié dans le presse-papier !');
    } catch {
      showToast('🔗 ' + url);
    }
  };

  const handleDownload = async (article, index) => {
    const node = document.getElementById(`hero-post-card-${article.id || index}`);
    if (!node) return;

    try {
      showToast('Préparation du post en image...');

      const dataUrl = await htmlToImage.toPng(node, {
        quality: 1,
        pixelRatio: 2.5,
        backgroundColor: '#ffffff',
        style: {
          background: '#ffffff',
          padding: '24px 20px',
          borderRadius: '16px',
        },
      });

      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `afolukutv-${article.slug || 'post'}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast('✅ Post téléchargé en image PNG !');
    } catch (err) {
      console.error('Erreur lors du téléchargement du post:', err);
      // Fallback
      showToast('Téléchargement direct du visuel...');
      const fallbackUrl = article.image_url || '/afoluku-tv-logo-black.png';
      const a = document.createElement('a');
      a.href = fallbackUrl;
      a.target = '_blank';
      a.download = `${article.slug || 'post'}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  };

  return (
    <section
      className="hero-carousel hero-rectangle-stage"
      id="heroCarousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="hero-toast-notification">
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="carousel-container">
        {slides.map((article, index) => {
          const isActive = index === currentIndex;
          const isLiked = userLikedIds.includes(article.id);
          const likesCount = articleLikes[article.id] ?? (article.likes_count || 0);

          return (
            <div
              key={article.id || index}
              className={`carousel-slide${isActive ? ' active' : ''}`}
              style={{
                opacity: isActive ? 1 : 0,
                pointerEvents: isActive ? 'all' : 'none',
                transition: 'opacity 0.4s ease-in-out',
                position: isActive ? 'relative' : 'absolute',
                top: 0,
                left: 0,
                width: '100%',
              }}
            >
              <div className="hero-slide-wrapper">
                {/* ── ZONE DE CAPTURE DU POST COMPLET (TÉLÉCHARGÉ EN IMAGE) ── */}
                <div
                  id={`hero-post-card-${article.id || index}`}
                  className="hero-downloadable-card"
                >
                  {/* 1. LOGO AFOLUKU TV EN HAUT */}
                  <div className="hero-card-brand-top">
                    <img
                      src="/afoluku-tv-logo-black.png"
                      alt="A FOLUKU TV"
                      className="hero-card-brand-logo"
                      crossOrigin="anonymous"
                    />
                  </div>

                  {/* 2. ENCADREMENT RECTANGLE : PHOTO ENTIÈRE 100% */}
                  <Link
                    href={`/${lang}/article/${article.slug}`}
                    className="hero-rectangle-frame-link"
                    title={getTitle(article)}
                  >
                    <div className="hero-rectangle-encadrement">
                      <img
                        src={getProxiedImageUrl(article.image_url)}
                        alt={getTitle(article)}
                        className="hero-frame-photo-cover"
                        crossOrigin="anonymous"
                      />
                    </div>
                  </Link>

                  {/* 3. CATÉGORIE, TITRE, INTRODUCTION & MENTION BAS DE PAGE */}
                  <div className="hero-content-below">
                    {/* Catégorie */}
                    <div className="hero-badge-wrap">
                      <span className="badge badge-red hero-badge">
                        {article.category || dict.home?.headline || 'À LA UNE'}
                      </span>
                    </div>

                    {/* Le Titre */}
                    <Link href={`/${lang}/article/${article.slug}`} className="hero-title-link">
                      <h2 className="hero-article-title">{getTitle(article)}</h2>
                    </Link>

                    {/* L'Introduction */}
                    <p className="hero-article-desc">
                      {(getDesc(article) || '').substring(0, 190) + (getDesc(article)?.length > 190 ? '...' : '')}
                    </p>

                    {/* Mention obligatoire demandée tout en bas */}
                    <div className="hero-card-footer-mention">
                      <span className="footer-mention-text">
                        Article complet sur <span className="footer-mention-highlight">afolukutv.com</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── ACTIONS INTERACTIVES : EXCLUES DU TÉLÉCHARGEMENT ── */}
                <div className="hero-actions-row">
                  <Link
                    href={`/${lang}/article/${article.slug}`}
                    className="btn btn-primary hero-btn-read"
                  >
                    <span>{dict.home?.read_more || 'Lire la suite'}</span>
                    <ArrowRight size={14} style={{ marginLeft: '4px' }} />
                  </Link>

                  <div className="hero-social-actions">
                    {/* Bouton Like (sauvegarde dans les Favoris) */}
                    <button
                      type="button"
                      className={`hero-social-btn ${isLiked ? 'is-liked' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        handleLike(article);
                      }}
                      title={isLiked ? 'Retirer des favoris' : 'Liker et enregistrer dans vos favoris'}
                      aria-label="Liker cet article"
                    >
                      <Heart
                        size={16}
                        fill={isLiked ? '#dc2626' : 'none'}
                        color={isLiked ? '#dc2626' : '#475569'}
                      />
                      <span className="social-count">{likesCount}</span>
                    </button>

                    {/* Bouton Partager */}
                    <button
                      type="button"
                      className="hero-social-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        handleShare(article);
                      }}
                      title="Partager cet article"
                      aria-label="Partager cet article"
                    >
                      <Share2 size={16} color="#475569" />
                      <span className="social-text">Partager</span>
                    </button>

                    {/* Bouton Télécharger le post complet */}
                    <button
                      type="button"
                      className="hero-social-btn hero-download-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        handleDownload(article, index);
                      }}
                      title="Télécharger l'aperçu complet du post avec titre, catégorie et logo"
                      aria-label="Télécharger le post"
                    >
                      <Download size={16} color="#475569" />
                      <span className="social-text">Télécharger</span>
                    </button>
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
        .hero-rectangle-stage {
          position: relative;
          width: 100%;
          background: #ffffff;
          border-radius: 22px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
          border: 1px solid #e2e8f0;
          padding: 20px 20px 48px 20px;
        }

        .hero-toast-notification {
          position: absolute;
          top: 14px;
          left: 50%;
          transform: translateX(-50%);
          background: #0f172a;
          color: #ffffff;
          padding: 8px 20px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 600;
          z-index: 100;
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.2);
          pointer-events: none;
          white-space: nowrap;
          animation: toastPop 0.3s ease;
        }

        @keyframes toastPop {
          from {
            opacity: 0;
            transform: translate(-50%, -10px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }

        .carousel-container {
          position: relative;
          width: 100%;
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

        /* ── ZONE DE CAPTURE TÉLÉCHARGEABLE ── */
        .hero-downloadable-card {
          width: 100%;
          max-width: 680px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          background: #ffffff;
          padding: 8px 10px 14px 10px;
          border-radius: 16px;
        }

        .hero-card-brand-top {
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
        }

        .hero-card-brand-logo {
          height: 38px;
          max-height: 38px;
          width: auto;
          object-fit: contain;
          display: block;
        }

        /* 1. ENCADREMENT RECTANGLE */
        .hero-rectangle-frame-link {
          display: block;
          width: 100%;
          text-decoration: none;
          margin: 0 auto 14px auto;
          cursor: pointer;
        }

        .hero-rectangle-encadrement {
          position: relative;
          width: 100%;
          height: 280px;
          border-radius: 16px;
          overflow: hidden;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }

        .hero-rectangle-frame-link:hover .hero-rectangle-encadrement {
          transform: scale(1.015);
          border-color: rgba(239, 68, 68, 0.5);
          box-shadow: 0 12px 28px rgba(239, 68, 68, 0.15);
        }

        .hero-frame-photo-cover {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
          transition: transform 0.4s ease;
        }

        .hero-rectangle-frame-link:hover .hero-frame-photo-cover {
          transform: scale(1.03);
        }

        /* 2. CONTENU DU POST */
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
          box-shadow: 0 3px 10px rgba(220, 38, 38, 0.3);
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
          color: #0f172a;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          transition: color 0.2s ease;
        }

        .hero-title-link:hover .hero-article-title {
          color: #dc2626;
        }

        .hero-article-desc {
          font-size: 0.92rem;
          color: #475569;
          line-height: 1.45;
          margin: 0 0 14px 0;
          max-width: 640px;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* MENTION BAS DE PAGE SUR LE POST TÉLÉCHARGÉ */
        .hero-card-footer-mention {
          margin-top: 6px;
          padding-top: 10px;
          border-top: 1px dashed #e2e8f0;
          width: 100%;
          max-width: 480px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .footer-mention-text {
          font-size: 11.5px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          font-weight: 600;
        }

        .footer-mention-highlight {
          color: #dc2626;
          font-weight: 800;
        }

        /* ── LIGNE D'ACTIONS INTERACTIVES ── */
        .hero-actions-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 14px;
        }

        .hero-btn-read {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 18px;
          font-size: 12.5px;
          font-weight: 700;
          border-radius: 9999px;
          box-shadow: 0 4px 14px rgba(220, 38, 38, 0.3);
          transition: transform 0.2s ease;
          text-decoration: none;
        }

        .hero-btn-read:hover {
          transform: translateY(-2px);
        }

        .hero-social-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .hero-social-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 9999px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #334155;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s ease;
          line-height: 1;
        }

        .hero-social-btn:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
          color: #0f172a;
          transform: translateY(-1px);
        }

        .hero-social-btn.is-liked {
          background: #fef2f2;
          border-color: #fecaca;
          color: #dc2626;
        }

        .hero-social-btn.is-liked:hover {
          background: #fee2e2;
        }

        .hero-download-btn:hover {
          border-color: #0f172a;
          color: #0f172a;
        }

        .social-count {
          font-size: 12px;
          font-weight: 700;
        }

        .social-text {
          font-size: 12px;
          font-weight: 600;
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
          background-color: #cbd5e1;
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
          .hero-rectangle-stage {
            padding: 12px 10px 38px 10px;
            border-radius: 18px;
            box-shadow: 0 2px 14px rgba(0, 0, 0, 0.05);
          }

          .hero-downloadable-card {
            padding: 6px 6px 12px 6px;
          }

          .hero-card-brand-logo {
            height: 30px;
            max-height: 30px;
          }

          .hero-rectangle-encadrement {
            height: 210px;
            border-radius: 14px;
          }

          .hero-article-title {
            font-size: 1.18rem;
            line-height: 1.3;
            margin-bottom: 8px;
            color: #0f172a;
          }

          .hero-article-desc {
            font-size: 0.82rem;
            line-height: 1.35;
            margin-bottom: 10px;
            color: #475569;
          }

          .hero-card-footer-mention {
            padding-top: 8px;
            margin-top: 4px;
          }

          .footer-mention-text {
            font-size: 10px;
          }

          .hero-actions-row {
            gap: 8px;
            margin-top: 10px;
          }

          .hero-btn-read {
            padding: 6px 14px;
            font-size: 11.5px;
          }

          .hero-social-btn {
            padding: 6px 10px;
            gap: 4px;
            font-size: 11px;
          }

          .carousel-indicators {
            bottom: 10px;
          }
        }
      `}</style>
    </section>
  );
}
