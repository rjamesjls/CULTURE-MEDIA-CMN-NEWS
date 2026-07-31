'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function ArticleComments({ articleId, initialComments = [] }) {
  const [comments, setComments] = useState(initialComments);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch comments in case initialComments is not passed or we want real-time (optional)
  useEffect(() => {
    if (initialComments.length === 0) {
      const fetchComments = async () => {
        const { data } = await supabase
          .from('comments')
          .select('*')
          .eq('article_id', articleId)
          .eq('status', 'approved')
          .order('created_at', { ascending: false });
        
        if (data) setComments(data);
      };
      fetchComments();
    }
  }, [articleId, initialComments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;
    
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const newComment = {
        article_id: articleId,
        author_name: name.trim(),
        content: content.trim(),
        status: 'approved'
      };

      const { data, error: insertError } = await supabase
        .from('comments')
        .insert([newComment])
        .select()
        .single();

      if (insertError) throw insertError;

      setComments([data, ...comments]);
      setName('');
      setContent('');
      setSuccess('Votre commentaire a été publié avec succès !');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error(err);
      setError('Une erreur est survenue lors de l\'envoi du commentaire.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="article-comments" style={{ marginTop: '50px' }}>
      <h3 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '25px', fontFamily: 'var(--font-heading)' }}>
        Commentaires ({comments.length})
      </h3>

      {/* Formulaire */}
      <div style={{ backgroundColor: '#f9fafb', padding: '25px', borderRadius: '12px', marginBottom: '40px', border: '1px solid #e5e7eb' }}>
        <h4 style={{ fontSize: '1.2rem', marginBottom: '15px', fontWeight: '600' }}>Laissez un commentaire</h4>
        
        {error && <div style={{ color: '#dc2626', backgroundColor: '#fee2e2', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px' }}>{error}</div>}
        {success && <div style={{ color: '#059669', backgroundColor: '#d1fae5', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px' }}>{success}</div>}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <input 
              type="text" 
              placeholder="Votre nom ou pseudo" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 15px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '15px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>
          <div>
            <textarea 
              placeholder="Votre message..." 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows="4"
              style={{
                width: '100%',
                padding: '12px 15px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '15px',
                outline: 'none',
                resize: 'vertical',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            ></textarea>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              type="submit" 
              disabled={isSubmitting}
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '15px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => { if(!isSubmitting) e.currentTarget.style.backgroundColor = 'var(--color-primary-dark)' }}
              onMouseOut={(e) => { if(!isSubmitting) e.currentTarget.style.backgroundColor = 'var(--color-primary)' }}
            >
              {isSubmitting ? 'Publication...' : 'Publier'}
            </button>
          </div>
        </form>
      </div>

      {/* Liste des commentaires */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {comments.length === 0 ? (
          <p style={{ color: '#6b7280', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
            Soyez le premier à commenter cet article !
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} style={{ padding: '20px', borderRadius: '10px', backgroundColor: '#ffffff', border: '1px solid #f3f4f6', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ fontWeight: '600', color: '#111827', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '35px', height: '35px', borderRadius: '50%', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: '14px' }}>
                    <i className="fas fa-user"></i>
                  </div>
                  {comment.author_name}
                </div>
                <div style={{ fontSize: '13px', color: '#9ca3af' }}>
                  {new Date(comment.created_at).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
              <p style={{ color: '#4b5563', lineHeight: '1.6', margin: '0', paddingLeft: '45px', whiteSpace: 'pre-wrap' }}>
                {comment.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
