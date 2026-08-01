'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function ArticleInteractions({ articleId, initialLikes = 0 }) {
  const [likes, setLikes] = useState(initialLikes);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  
  const [user, setUser] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [shareFeedback, setShareFeedback] = useState('');

  // Initialisation
  useEffect(() => {
    // Check likes
    const likedArticles = JSON.parse(localStorage.getItem('cmn_liked_articles') || '[]');
    if (likedArticles.includes(articleId)) {
      setHasLiked(true);
    }
    
    // Check auth and bookmarks
    const checkAuthAndBookmark = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data } = await supabase
          .from('bookmarks')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('article_id', articleId)
          .single();
        
        if (data) {
          setIsBookmarked(true);
        }
      }
    };
    checkAuthAndBookmark();
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

  const handleBookmark = async () => {
    if (!user) {
      alert("Veuillez vous connecter ou créer un compte pour sauvegarder cet article.");
      window.location.href = '/auth/login';
      return;
    }

    if (isBookmarking) return;
    setIsBookmarking(true);

    try {
      if (isBookmarked) {
        // Remove bookmark
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .match({ user_id: user.id, article_id: articleId });
        
        if (!error) {
          setIsBookmarked(false);
          setShareFeedback('Retiré des favoris');
        }
      } else {
        // Add bookmark
        const { error } = await supabase
          .from('bookmarks')
          .insert({ user_id: user.id, article_id: articleId });
        
        if (!error) {
          setIsBookmarked(true);
          setShareFeedback('Ajouté aux favoris !');
        }
      }
      setTimeout(() => setShareFeedback(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsBookmarking(false);
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
      <div style={{ display: 'flex', gap: '15px', position: 'relative' }}>
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
        
        <button 
          onClick={handleBookmark}
          disabled={isBookmarking}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: isBookmarked ? '#e0e7ff' : '#f3f4f6',
            color: isBookmarked ? '#4f46e5' : '#4b5563',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '25px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '15px',
            transition: 'all 0.2s',
            boxShadow: isBookmarked ? '0 2px 10px rgba(79, 70, 229, 0.2)' : 'none'
          }}
          onMouseOver={(e) => {
            if (!isBookmarked) e.currentTarget.style.backgroundColor = '#e5e7eb';
          }}
          onMouseOut={(e) => {
            if (!isBookmarked) e.currentTarget.style.backgroundColor = '#f3f4f6';
          }}
          title={user ? (isBookmarked ? "Retirer des favoris" : "Sauvegarder cet article") : "Connectez-vous pour sauvegarder"}
        >
          <i className={isBookmarked ? 'fas fa-bookmark' : 'far fa-bookmark'} style={{ fontSize: '18px' }}></i>
          Sauvegarder
        </button>
        
        {shareFeedback && (shareFeedback.includes('favoris') || shareFeedback.includes('Retiré')) && (
          <span style={{ position: 'absolute', bottom: '110%', left: '80%', transform: 'translateX(-50%)', backgroundColor: '#374151', color: 'white', fontSize: '12px', padding: '4px 8px', borderRadius: '4px', whiteSpace: 'nowrap', zIndex: 10 }}>
            {shareFeedback}
          </span>
        )}
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
          {shareFeedback && shareFeedback.includes('copié') && (
            <span style={{ position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#374151', color: 'white', fontSize: '12px', padding: '4px 8px', borderRadius: '4px', whiteSpace: 'nowrap', zIndex: 10 }}>
              {shareFeedback}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
