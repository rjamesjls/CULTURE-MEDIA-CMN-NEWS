'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function ArticleInteractions({ articleId, initialLikes = 0 }) {
  const [likes, setLikes] = useState(initialLikes);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [shareFeedback, setShareFeedback] = useState('');

  // Vérifier dans le localStorage si l'utilisateur a déjà liké
  useEffect(() => {
    const likedArticles = JSON.parse(localStorage.getItem('cmn_liked_articles') || '[]');
    if (likedArticles.includes(articleId)) {
      setHasLiked(true);
    }
  }, [articleId]);

  const handleLike = async () => {
    if (hasLiked || isLiking) return;
    setIsLiking(true);

    try {
      // Optimistic update
      setLikes(prev => prev + 1);
      setHasLiked(true);
      
      const likedArticles = JSON.parse(localStorage.getItem('cmn_liked_articles') || '[]');
      likedArticles.push(articleId);
      localStorage.setItem('cmn_liked_articles', JSON.stringify(likedArticles));

      // Call RPC
      const { error } = await supabase.rpc('increment_article_likes', {
        article_id: articleId
      });

      if (error) {
        console.error('Erreur lors du like:', error);
        // Revert optimistic update
        setLikes(prev => prev - 1);
        setHasLiked(false);
        const filtered = likedArticles.filter(id => id !== articleId);
        localStorage.setItem('cmn_liked_articles', JSON.stringify(filtered));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async (platform) => {
    const url = window.location.href;
    const title = document.title;

    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank');
        break;
      case 'whatsapp':
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' ' + url)}`, '_blank');
        break;
      case 'copy':
        try {
          await navigator.clipboard.writeText(url);
          setShareFeedback('Lien copié !');
          setTimeout(() => setShareFeedback(''), 3000);
        } catch (err) {
          console.error('Failed to copy', err);
        }
        break;
      default:
        break;
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '15px',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px 0',
      borderTop: '1px solid #e5e7eb',
      borderBottom: '1px solid #e5e7eb',
      marginTop: '40px',
      marginBottom: '40px'
    }}>
      <div style={{ display: 'flex', gap: '15px' }}>
        <button 
          onClick={handleLike}
          disabled={hasLiked || isLiking}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: hasLiked ? '#fce7f3' : '#f3f4f6',
            color: hasLiked ? '#db2777' : '#4b5563',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '25px',
            cursor: hasLiked ? 'default' : 'pointer',
            fontWeight: '600',
            fontSize: '15px',
            transition: 'all 0.2s',
            boxShadow: hasLiked ? '0 2px 10px rgba(219, 39, 119, 0.2)' : 'none'
          }}
          onMouseOver={(e) => {
            if (!hasLiked) {
              e.currentTarget.style.backgroundColor = '#e5e7eb';
            }
          }}
          onMouseOut={(e) => {
            if (!hasLiked) {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }
          }}
        >
          <i className={hasLiked ? 'fas fa-heart' : 'far fa-heart'} style={{ fontSize: '18px' }}></i>
          {likes} {likes > 1 ? 'J\'aimes' : 'J\'aime'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>Partager :</span>
        
        <button 
          onClick={() => handleShare('facebook')}
          style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#1877f2', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }}
          title="Partager sur Facebook"
        >
          <i className="fab fa-facebook-f"></i>
        </button>
        
        <button 
          onClick={() => handleShare('twitter')}
          style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#000000', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }}
          title="Partager sur X (Twitter)"
        >
          <i className="fab fa-x-twitter"></i>
        </button>
        
        <button 
          onClick={() => handleShare('whatsapp')}
          style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#25d366', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }}
          title="Partager sur WhatsApp"
        >
          <i className="fab fa-whatsapp" style={{ fontSize: '18px' }}></i>
        </button>
        
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => handleShare('copy')}
            style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f3f4f6', color: '#4b5563', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s' }}
            title="Copier le lien"
          >
            <i className="fas fa-link"></i>
          </button>
          {shareFeedback && (
            <span style={{ position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#374151', color: 'white', fontSize: '12px', padding: '4px 8px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
              {shareFeedback}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
