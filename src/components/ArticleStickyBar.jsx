'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Heart, Share2 } from 'lucide-react';
import { incrementLike, incrementShare } from '@/app/actions/analytics';
import { supabase } from '@/lib/supabase';

export default function ArticleStickyBar({ article, lang = 'fr' }) {
  const [likesCount, setLikesCount] = useState(article?.likes_count || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [user, setUser] = useState(null);

  const articleId = article?.id;
  const title = (lang === 'bsh' && article?.title_bsh) ? article.title_bsh : article?.title;

  useEffect(() => {
    if (!articleId) return;
    try {
      const likedArticles = JSON.parse(localStorage.getItem('cmn_liked_articles') || '[]');
      if (likedArticles.includes(articleId)) {
        setIsLiked(true);
      }
    } catch {
      // ignore
    }

    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) setUser(session.user);
    };
    checkUser();
  }, [articleId]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleLike = async () => {
    if (!articleId) return;

    if (isLiked) {
      setIsLiked(false);
      setLikesCount((prev) => Math.max(0, prev - 1));
      try {
        const likedArticles = JSON.parse(localStorage.getItem('cmn_liked_articles') || '[]');
        const filtered = likedArticles.filter((id) => id !== articleId);
        localStorage.setItem('cmn_liked_articles', JSON.stringify(filtered));
      } catch {
        // ignore
      }
      showToast('Article retiré de vos favoris');
    } else {
      setIsLiked(true);
      setLikesCount((prev) => prev + 1);
      try {
        const likedArticles = JSON.parse(localStorage.getItem('cmn_liked_articles') || '[]');
        likedArticles.push(articleId);
        localStorage.setItem('cmn_liked_articles', JSON.stringify(likedArticles));
      } catch {
        // ignore
      }

      incrementLike(articleId).catch(console.error);

      if (user) {
        try {
          await supabase.from('bookmarks').upsert({ user_id: user.id, article_id: articleId });
          showToast('❤️ Ajouté aux favoris !');
        } catch {
          showToast('❤️ Article liké !');
        }
      } else {
        showToast('❤️ Article liké !');
      }
    }
  };

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: (lang === 'bsh' && article?.hook_bsh) ? article.hook_bsh : article?.description || title,
          url,
        });
        incrementShare(articleId).catch(console.error);
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
      incrementShare(articleId).catch(console.error);
      showToast('🔗 Lien copié !');
    } catch {
      showToast('🔗 ' + url);
    }
  };

  return (
    <div className="article-sticky-subbar">
      <div className="sticky-subbar-container">
        {/* Gauche : Bouton retour & catégorie */}
        <div className="sticky-subbar-left">
          <Link
            href={`/${lang}`}
            className="sticky-back-btn"
            title={lang === 'bsh' ? 'Dray go baka' : 'Retour aux actualités'}
          >
            <ArrowLeft size={14} />
            <span className="sticky-back-text">{lang === 'bsh' ? 'Retour' : 'Retour aux actualités'}</span>
          </Link>

          <span className="sticky-cat-badge">
            {article?.category || 'ACTUALITÉ'}
          </span>
        </div>

        {/* Droite : Bouton Like & Partager */}
        <div className="sticky-subbar-right">
          {/* Bouton Like */}
          <button
            type="button"
            onClick={handleLike}
            className={`sticky-action-btn ${isLiked ? 'is-liked' : ''}`}
            title={isLiked ? 'Retirer des favoris' : 'Liker cet article'}
          >
            <Heart
              size={14}
              fill={isLiked ? '#dc2626' : 'none'}
              color={isLiked ? '#dc2626' : '#475569'}
            />
            <span className="sticky-btn-label">{likesCount}</span>
          </button>

          {/* Bouton Partager */}
          <button
            type="button"
            onClick={handleShare}
            className="sticky-action-btn"
            title="Partager cet article"
          >
            <Share2 size={14} color="#475569" />
            <span className="sticky-btn-label">Partager</span>
          </button>

          {/* Toast */}
          {toastMessage && (
            <div className="sticky-toast">
              {toastMessage}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .article-sticky-subbar {
          position: sticky;
          top: 88px;
          z-index: 95;
          width: 100%;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid #e2e8f0;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
          transition: top 0.2s ease;
        }

        .sticky-subbar-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 8px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .sticky-subbar-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .sticky-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 9999px;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          color: #334155;
          font-size: 11.5px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s ease;
          white-space: nowrap;
          line-height: 1;
        }

        .sticky-back-btn:hover {
          background: #e2e8f0;
          color: #0f172a;
          transform: translateX(-1px);
        }

        .sticky-cat-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 9999px;
          background: var(--color-primary, #dc2626);
          color: #ffffff;
          font-size: 10.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          white-space: nowrap;
          line-height: 1;
        }

        .sticky-subbar-right {
          display: flex;
          align-items: center;
          gap: 8px;
          position: relative;
        }

        .sticky-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 12px;
          border-radius: 9999px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #475569;
          font-size: 11.5px;
          font-weight: 600;
          cursor: pointer;
          line-height: 1;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
        }

        .sticky-action-btn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #0f172a;
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
        }

        .sticky-action-btn.is-liked {
          background: #fef2f2;
          border-color: #fecaca;
          color: #dc2626;
        }

        .sticky-action-btn.is-liked:hover {
          background: #fee2e2;
        }

        .sticky-btn-label {
          font-size: 11.5px;
          font-weight: 600;
        }

        .sticky-toast {
          position: absolute;
          bottom: -32px;
          right: 0;
          background-color: #0f172a;
          color: #ffffff;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          white-space: nowrap;
          z-index: 30;
        }

        @media (max-width: 768px) {
          .article-sticky-subbar {
            top: 76px;
          }

          .sticky-subbar-container {
            padding: 6px 12px;
          }

          .sticky-back-text {
            display: none;
          }

          .sticky-back-btn {
            padding: 5px 8px;
          }

          .sticky-action-btn {
            padding: 5px 9px;
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  );
}
