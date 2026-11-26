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

  // MOTEUR CANVAS HAUTE DÉFINITION : Génère un post 1080x1350 net, complet et sans faille
  const handleDownload = async (article) => {
    try {
      showToast('Génération du post officiel...');

      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1350;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Impossible de créer le contexte canvas');

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

      // 2. Chargement des images (Logo officiel, photo de l'article et icônes réseaux sociaux noires)
      const loadImg = (src, timeoutMs = 4500) => {
        return new Promise((resolve) => {
          if (!src) return resolve(null);
          let done = false;
          const timer = setTimeout(() => {
            if (!done) {
              done = true;
              resolve(null);
            }
          }, timeoutMs);

          const img = new Image();
          if (src.startsWith('http://') || src.startsWith('https://')) {
            img.crossOrigin = 'anonymous';
          }
          img.onload = () => {
            if (!done) {
              done = true;
              clearTimeout(timer);
              resolve(img);
            }
          };
          img.onerror = () => {
            if (!done) {
              if (img.crossOrigin) {
                const retryImg = new Image();
                retryImg.onload = () => {
                  if (!done) {
                    done = true;
                    clearTimeout(timer);
                    resolve(retryImg);
                  }
                };
                retryImg.onerror = () => {
                  if (!done) {
                    done = true;
                    clearTimeout(timer);
                    resolve(null);
                  }
                };
                retryImg.src = src;
              } else {
                done = true;
                clearTimeout(timer);
                resolve(null);
              }
            }
          };
          img.src = src;
        });
      };

      // SVGs officiels en noir (#0f172a)
      const fbSvg = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#0f172a"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>');
      const igSvg = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#0f172a"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>');
      const ttSvg = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#0f172a"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"/></svg>');
      const scSvg = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#0f172a"><path d="M12.016 2c-3.792 0-6.115 2.766-6.115 5.568 0 1.25.438 2.396.974 3.328-.24.104-.63.297-.854.432-.422.25-.662.614-.662 1.052 0 .542.443.99 1.135 1.156.094.02.193.036.297.052-.083.333-.25.802-.635 1.344-.61.854-1.37 1.135-2.026 1.135-.292 0-.583-.057-.85-.177-.182-.083-.396-.062-.562.052-.167.115-.26.302-.24.5.031.333.328.786.89 1.182.74.52 1.76.792 2.953.792.354 0 .729-.026 1.115-.083.542-.083 1.11-.27 1.63-.448.297-.104.594-.208.88-.27.188-.042.385-.01.552.094.27.167.583.479.974.792.833.667 1.844 1.229 3.125 1.229 1.27 0 2.28-.562 3.115-1.229.39-.313.708-.625.979-.792.167-.104.365-.135.552-.094.286.062.583.166.88.27.521.178 1.089.365 1.63.448.386.057.761.083 1.115.083 1.193 0 2.213-.272 2.953-.792.563-.396.86-.849.89-1.182.021-.198-.073-.385-.24-.5-.167-.114-.38-.135-.562-.052-.267.12-.558.177-.85.177-.656 0-1.416-.281-2.026-1.135-.385-.542-.552-1.011-.635-1.344.104-.016.203-.032.297-.052.692-.166 1.135-.614 1.135-1.156 0-.438-.24-.802-.662-1.052-.224-.135-.614-.328-.854-.432.536-.932.974-2.078.974-3.328 0-2.802-2.323-5.568-6.115-5.568z"/></svg>');

      const [logoImg, photoImg, fbImg, igImg, ttImg, scImg] = await Promise.all([
        loadImg('/afoluku-tv-logo-black.png'),
        loadImg(getProxiedImageUrl(article.image_url)),
        loadImg(fbSvg),
        loadImg(igSvg),
        loadImg(ttSvg),
        loadImg(scSvg),
      ]);

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

      // 8. Bas de page : Mention obligatoire + Réseaux sociaux en noir + Domaine
      ctx.beginPath();
      ctx.moveTo(60, 1240);
      ctx.lineTo(1020, 1240);
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#0f172a';
      ctx.font = '800 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('Article complet sur ', 60, 1290);
      const textLen = ctx.measureText('Article complet sur ').width;
      ctx.fillStyle = '#dc2626';
      ctx.fillText('AFOLUKU TV', 60 + textLen, 1290);

      // Icônes réseaux sociaux officielles en noir (Facebook, Instagram, TikTok, Snapchat)
      const socialIcons = [fbImg, igImg, ttImg, scImg];
      let iconStartX = 510;
      const iconY = 1269;
      const iconSize = 30;
      const iconGap = 20;

      socialIcons.forEach((icon) => {
        if (icon) {
          ctx.drawImage(icon, iconStartX, iconY, iconSize, iconSize);
        }
        iconStartX += iconSize + iconGap;
      });

      // Badge du domaine
      ctx.fillStyle = '#0f172a';
      drawRoundRect(840, 1262, 180, 44, 22);
      ctx.fill();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('afolukutv.com', 930, 1290);

      // 9. Export PNG garanti
      const triggerDownload = (url) => {
        const a = document.createElement('a');
        a.href = url;
        a.download = `afolukutv-${article.slug || 'post'}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        showToast('✅ Post téléchargé avec succès (1080x1350 PNG) !');
      };

      try {
        canvas.toBlob((blob) => {
          if (blob) {
            const blobUrl = window.URL.createObjectURL(blob);
            triggerDownload(blobUrl);
            setTimeout(() => window.URL.revokeObjectURL(blobUrl), 3000);
          } else {
            const dataUrl = canvas.toDataURL('image/png');
            triggerDownload(dataUrl);
          }
        }, 'image/png');
      } catch {
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
