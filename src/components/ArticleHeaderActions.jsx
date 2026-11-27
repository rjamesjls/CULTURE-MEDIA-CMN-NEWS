'use client';

import { useState, useEffect } from 'react';
import { Heart, Share2 } from 'lucide-react';
import { incrementLike, incrementShare } from '@/app/actions/analytics';
import { supabase } from '@/lib/supabase';

export default function ArticleHeaderActions({ article, lang = 'fr' }) {
  const [likesCount, setLikesCount] = useState(article?.likes_count || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [user, setUser] = useState(null);

  const articleId = article?.id;

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
          showToast('❤️ Ajouté aux favoris de votre compte !');
        } catch {
          showToast('❤️ Article liké !');
        }
      } else {
        showToast('❤️ Article liké !');
      }
    }
  };

  const handleShare = async () => {
    const title = (lang === 'bsh' && article?.title_bsh) ? article.title_bsh : article?.title;
    const shortUrl = (typeof window !== 'undefined' && articleId) ? `${window.location.origin}/a/${articleId}` : '';
    const url = shortUrl || (typeof window !== 'undefined' ? window.location.href : '');

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
      showToast('🔗 Lien copié dans le presse-papier !');
    } catch {
      showToast('🔗 ' + url);
    }
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', position: 'relative' }}>
      {/* Bouton Like */}
      <button
        type="button"
        onClick={handleLike}
        title={isLiked ? 'Retirer des favoris' : 'Liker cet article'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '5px 11px',
          borderRadius: '9999px',
          background: isLiked ? '#fef2f2' : 'rgba(255, 255, 255, 0.95)',
          border: isLiked ? '1px solid #fecaca' : '1px solid rgba(226, 232, 240, 0.95)',
          color: isLiked ? '#dc2626' : '#475569',
          fontSize: '11.5px',
          fontWeight: '600',
          cursor: 'pointer',
          lineHeight: 1,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <Heart
          size={14}
          fill={isLiked ? '#dc2626' : 'none'}
          color={isLiked ? '#dc2626' : '#475569'}
        />
        <span>{likesCount}</span>
      </button>

      {/* Bouton Partager */}
      <button
        type="button"
        onClick={handleShare}
        title="Partager cet article"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '5px 11px',
          borderRadius: '9999px',
          background: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid rgba(226, 232, 240, 0.95)',
          color: '#475569',
          fontSize: '11.5px',
          fontWeight: '500',
          cursor: 'pointer',
          lineHeight: 1,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <Share2 size={14} color="#475569" />
        <span>Partager</span>
      </button>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'absolute',
            bottom: '-34px',
            right: 0,
            backgroundColor: '#0f172a',
            color: '#fff',
            fontSize: '11px',
            fontWeight: '600',
            padding: '4px 10px',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            whiteSpace: 'nowrap',
            zIndex: 30,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
