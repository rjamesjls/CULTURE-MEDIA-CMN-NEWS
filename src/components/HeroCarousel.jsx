'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Heart, Share2, Download, ArrowRight } from 'lucide-react';
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

      incrementLike(articleId).catch(console.error);

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

  // MOTEUR CANVAS 2K ULTRA-HD : Génère un post 2160x2700 net, vectoriel et complet
  const handleDownload = async (article) => {
    try {
      showToast('Génération du post 2K...');

      const scale = 2; // Rendu 2K Ultra-HD (2160 x 2700 px)
      const canvas = document.createElement('canvas');
      canvas.width = 1080 * scale;
      canvas.height = 1350 * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Impossible de créer le contexte canvas');
      ctx.scale(scale, scale);

      // Helper coins arrondis
      const drawRoundRect = (x, y, width, height, radius) => {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
      };

      // Helper retour à la ligne
      const drawWrapText = (text, x, y, maxWidth, lineHeight, maxLines) => {
        const words = (text || '').split(' ');
        let line = '';
        let linesCount = 0;
        let currentY = y;

        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && n > 0) {
            linesCount++;
            if (maxLines && linesCount >= maxLines) {
              ctx.fillText(line.trim() + '...', x, currentY);
              return currentY + lineHeight;
            }
            ctx.fillText(line.trim(), x, currentY);
            line = words[n] + ' ';
            currentY += lineHeight;
          } else {
            line = testLine;
          }
        }
        if (line.trim().length > 0) {
          ctx.fillText(line.trim(), x, currentY);
          currentY += lineHeight;
        }
        return currentY;
      };

      // 1. Fond blanc pur
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 1080, 1350);

      // 2. Chargement sécurisé des images (Fetch/Blob pour garantir ZÉRO corruption CORS)
      const loadSafeImg = async (url, timeoutMs = 4500) => {
        if (!url) return null;
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), timeoutMs);
          const res = await fetch(url, { signal: controller.signal });
          clearTimeout(timer);
          if (!res.ok) return null;
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);

          return await new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ img, blobUrl });
            img.onerror = () => {
              URL.revokeObjectURL(blobUrl);
              resolve(null);
            };
            img.src = blobUrl;
          });
        } catch {
          return null;
        }
      };

      const [logoData, photoData] = await Promise.all([
        loadSafeImg('/afoluku-tv-logo-black.png'),
        loadSafeImg(getProxiedImageUrl(article.image_url)),
      ]);

      const logoImg = logoData?.img || null;
      const photoImg = photoData?.img || null;

      // 3. En-tête : Logo AFOLUKU TV en haut à gauche
      if (logoImg) {
        const logoH = 56;
        const logoW = (logoImg.width / logoImg.height) * logoH;
        ctx.drawImage(logoImg, 60, 48, logoW, logoH);
      } else {
        ctx.fillStyle = '#0f172a';
        ctx.font = '900 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('AFOLUKU TV', 60, 88);
      }

      // Slogan + Date en haut à droite
      const slogan = lang === 'bsh' ? 'WI MEDIA, WI KULTURU, WI TOLI' : 'NOTRE MÉDIA, NOS CULTURES, NOS HISTOIRES';
      ctx.textAlign = 'right';
      ctx.fillStyle = '#0f172a';
      ctx.font = '800 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(slogan, 1020, 72);

      const pubDate = new Date(article.pub_date || Date.now()).toLocaleDateString(
        lang === 'bsh' ? 'bs-BA' : 'fr-FR',
        { day: 'numeric', month: 'long', year: 'numeric' }
      );
      ctx.fillStyle = '#64748b';
      ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(pubDate, 1020, 96);

      // Ligne séparatrice
      ctx.beginPath();
      ctx.moveTo(60, 126);
      ctx.lineTo(1020, 126);
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 4. Cadre photo (960px x 560px) avec cadrage propre
      const photoX = 60;
      const photoY = 155;
      const photoW = 960;
      const photoH = 560;

      ctx.save();
      drawRoundRect(photoX, photoY, photoW, photoH, 20);
      ctx.clip();

      if (photoImg) {
        const imgRatio = photoImg.width / photoImg.height;
        const targetRatio = photoW / photoH;
        let sx, sy, sWidth, sHeight;
        if (imgRatio > targetRatio) {
          sHeight = photoImg.height;
          sWidth = photoImg.height * targetRatio;
          sx = (photoImg.width - sWidth) / 2;
          sy = 0;
        } else {
          sWidth = photoImg.width;
          sHeight = photoImg.width / targetRatio;
          sx = 0;
          sy = (photoImg.height - sHeight) / 2;
        }
        ctx.drawImage(photoImg, sx, sy, sWidth, sHeight, photoX, photoY, photoW, photoH);
      } else {
        const grad = ctx.createLinearGradient(photoX, photoY, photoX + photoW, photoY + photoH);
        grad.addColorStop(0, '#1e293b');
        grad.addColorStop(1, '#0f172a');
        ctx.fillStyle = grad;
        ctx.fillRect(photoX, photoY, photoW, photoH);

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('AFOLUKU TV', photoX + photoW / 2, photoY + photoH / 2);
      }
      ctx.restore();

      // Bordure photo
      drawRoundRect(photoX, photoY, photoW, photoH, 20);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 5. Badge Catégorie
      const category = (article.category || dict.home?.headline || 'À LA UNE').toUpperCase();
      ctx.font = '900 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const catTextW = ctx.measureText(category).width;
      const catBadgeW = catTextW + 36;
      const catBadgeY = 744;

      drawRoundRect(60, catBadgeY, catBadgeW, 38, 8);
      ctx.fillStyle = '#dc2626';
      ctx.fill();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(category, 78, catBadgeY + 25);

      // 6. Titre de l'article (Agrandissement demandé)
      ctx.fillStyle = '#0f172a';
      ctx.font = '900 44px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const titleEndY = drawWrapText(getTitle(article), 60, 835, 960, 56, 3);

      // 7. Corps / Introduction de l'article (Agrandissement demandé)
      ctx.fillStyle = '#334155';
      ctx.font = '500 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      drawWrapText(getDesc(article) || '', 60, titleEndY + 26, 960, 40, 4);

      // 8. Bas de page : Séparateur pointillé foncé + Mention + Logos avec 'SUIVEZ-NOUS' + Domaine
      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([8, 8]);
      ctx.moveTo(60, 1225);
      ctx.lineTo(1020, 1225);
      ctx.strokeStyle = '#94a3b8'; // Gris plus foncé et en pointillés
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#0f172a';
      ctx.font = '800 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('Article complet sur ', 60, 1290);
      const textLen = ctx.measureText('Article complet sur ').width;
      ctx.fillStyle = '#dc2626';
      ctx.fillText('AFOLUKU TV', 60 + textLen, 1290);

      // Rendu vectoriel natif des logos réseaux sociaux en noir (ZÉRO risque de canvas tainting)
      const drawSvgPath = (pathString, origW, origH, targetX, targetY, targetSize) => {
        ctx.save();
        ctx.translate(targetX, targetY);
        const s = targetSize / Math.max(origW, origH);
        ctx.scale(s, s);
        const path = new Path2D(pathString);
        ctx.fillStyle = '#0f172a';
        ctx.fill(path);
        ctx.restore();
      };

      const iconsCenterX = 585;

      // Texte 'SUIVEZ-NOUS' au-dessus des logos
      ctx.textAlign = 'center';
      ctx.fillStyle = '#64748b';
      ctx.font = '800 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('SUIVEZ-NOUS', iconsCenterX, 1254);

      // Tracés vectoriels officiels
      const fbPath = 'M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z';
      const igPath = 'M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z';
      const ttPath = 'M448 209.91a210.06 210.06 0 0 1-122.77-39.25V349.38A162.55 162.55 0 1 1 185 188.31V278.2a74.62 74.62 0 1 0 52.23 71.18V0l88 0a121.18 121.18 0 0 0 1.86 22.17h0A122.18 122.18 0 0 0 381 102.39a121.43 121.43 0 0 0 67 20.14z';

      // Placement des 3 logos en noir officiel
      drawSvgPath(fbPath, 512, 512, 520, 1270, 30);
      drawSvgPath(igPath, 448, 512, 570, 1270, 30);
      drawSvgPath(ttPath, 448, 512, 620, 1270, 30);

      // Badge du domaine
      ctx.fillStyle = '#0f172a';
      drawRoundRect(840, 1262, 180, 44, 22);
      ctx.fill();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('afolukutv.com', 930, 1290);

      // 9. Export PNG 2K garanti
      const triggerDownload = (url) => {
        const a = document.createElement('a');
        a.href = url;
        a.download = `afolukutv-${article.slug || 'post'}-2k.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        showToast('✅ Post officiel 2K téléchargé !');
      };

      try {
        canvas.toBlob((blob) => {
          try {
            if (blob) {
              const blobUrl = window.URL.createObjectURL(blob);
              triggerDownload(blobUrl);
              setTimeout(() => window.URL.revokeObjectURL(blobUrl), 4000);
            } else {
              const dataUrl = canvas.toDataURL('image/png');
              triggerDownload(dataUrl);
            }
          } catch (innerErr) {
            console.error('Erreur export blob:', innerErr);
            const dataUrl = canvas.toDataURL('image/png');
            triggerDownload(dataUrl);
          }
        }, 'image/png');
      } catch (blobErr) {
        console.warn('Fallback toDataURL direct:', blobErr);
        const dataUrl = canvas.toDataURL('image/png');
        triggerDownload(dataUrl);
      }
    } catch (err) {
      console.error('Erreur téléchargement canvas:', err);
      showToast('Erreur lors de la génération du post');
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
              {/* ── AFFICHAGE SUR LE SITE : STRUCTURE D'ORIGINE 100% ÉPURÉE ── */}
              <div className="hero-slide-wrapper">
                {/* 1. ENCADREMENT RECTANGLE */}
                <Link
                  href={`/${lang}/article/${article.slug}`}
                  className="hero-rectangle-frame-link"
                  title={getTitle(article)}
                >
                  <div className="hero-rectangle-encadrement">
                    <img
                      src={
                        article.image_url ||
                        'https://images.unsplash.com/photo-1620287341056-49a2f1ab2fdc?q=80&w=1200&auto=format&fit=crop'
                      }
                      alt={getTitle(article)}
                      className="hero-frame-photo-cover"
                    />
                  </div>
                </Link>

                {/* 2. CATÉGORIE, TITRE, DESCRIPTION */}
                <div className="hero-content-below">
                  <div className="hero-badge-wrap">
                    <span className="badge badge-red hero-badge">
                      {article.category || dict.home?.headline || 'À LA UNE'}
                    </span>
                  </div>

                  <Link href={`/${lang}/article/${article.slug}`} className="hero-title-link">
                    <h2 className="hero-article-title">{getTitle(article)}</h2>
                  </Link>

                  <p className="hero-article-desc">
                    {(getDesc(article) || '').substring(0, 160) + '...'}
                  </p>

                  {/* Actions interactives */}
                  <div className="hero-actions-row">
                    <Link
                      href={`/${lang}/article/${article.slug}`}
                      className="btn btn-primary hero-btn-read"
                    >
                      <span>{dict.home?.read_more || 'Lire la suite'}</span>
                      <ArrowRight size={14} style={{ marginLeft: '4px' }} />
                    </Link>

                    <div className="hero-social-actions">
                      {/* Like */}
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

                      {/* Partager */}
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

                      {/* Télécharger le post complet */}
                      <button
                        type="button"
                        className="hero-social-btn hero-download-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          handleDownload(article);
                        }}
                        title="Télécharger l'aperçu complet du post"
                        aria-label="Télécharger le post"
                      >
                        <Download size={16} color="#475569" />
                        <span className="social-text">Télécharger</span>
                      </button>
                    </div>
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

        /* 1. ENCADREMENT RECTANGLE DU SITE */
        .hero-rectangle-frame-link {
          display: block;
          width: 100%;
          max-width: 680px;
          text-decoration: none;
          margin: 0 auto 16px auto;
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

        /* 2. CONTENU DU POST SUR LE SITE */
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
          margin: 0 0 16px 0;
          max-width: 680px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* ── LIGNE D'ACTIONS INTERACTIVES ── */
        .hero-actions-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
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

        @media (min-width: 992px) {
          .hero-rectangle-stage {
            padding: 24px 32px 48px 32px;
          }

          .hero-slide-wrapper {
            max-width: 1240px;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            text-align: left;
            gap: 40px;
          }

          .hero-rectangle-frame-link {
            flex: 1.25;
            max-width: 650px;
            margin: 0;
          }

          .hero-rectangle-encadrement {
            height: 400px;
            border-radius: 20px;
            box-shadow: 0 12px 36px rgba(0, 0, 0, 0.08);
          }

          .hero-content-below {
            flex: 1;
            align-items: flex-start;
            text-align: left;
            padding: 8px 0;
          }

          .hero-badge-wrap {
            margin-bottom: 12px;
          }

          .hero-article-title {
            font-size: 2.15rem;
            line-height: 1.25;
            margin-bottom: 14px;
            -webkit-line-clamp: 3;
          }

          .hero-article-desc {
            font-size: 1.05rem;
            line-height: 1.55;
            margin-bottom: 24px;
            max-width: 540px;
            -webkit-line-clamp: 3;
          }

          .hero-actions-row {
            justify-content: flex-start;
            gap: 14px;
          }

          .hero-btn-read {
            padding: 9px 22px;
            font-size: 13.5px;
          }

          .hero-social-btn {
            padding: 8px 16px;
            font-size: 13px;
          }
        }

        @media (max-width: 768px) {
          .hero-rectangle-stage {
            padding: 14px 12px 38px 12px;
            border-radius: 18px;
            box-shadow: 0 2px 14px rgba(0, 0, 0, 0.05);
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
            margin-bottom: 12px;
            color: #475569;
          }

          .hero-actions-row {
            gap: 8px;
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
