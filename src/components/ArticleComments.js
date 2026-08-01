'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function ArticleComments({ articleId, initialComments = [] }) {
  const [comments, setComments] = useState(initialComments);
  const [user, setUser] = useState(null);
  
  // Guest fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  // Common fields
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Fetch current user session
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    
    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    // Fetch comments in case initialComments is not passed
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
    
    return () => subscription.unsubscribe();
  }, [articleId, initialComments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!content.trim()) return;
    
    let finalName = '';
    
    if (user) {
      finalName = user.user_metadata?.name || user.user_metadata?.full_name || user.email.split('@')[0];
    } else {
      if (!name.trim() || !email.trim()) {
        setError('Veuillez remplir votre pseudo et votre email.');
        return;
      }
      if (!acceptedTerms) {
        setError('Vous devez accepter les conditions générales et la politique de confidentialité.');
        return;
      }
      finalName = name.trim();
    }
    
    setIsSubmitting(true);

    try {
      const newComment = {
        article_id: articleId,
        author_name: finalName,
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
      setContent('');
      if (!user) {
        setName('');
        setEmail('');
        setAcceptedTerms(false);
      }
      setSuccess('Votre commentaire a été publié avec succès !');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error(err);
      setError("Une erreur est survenue lors de l'envoi du commentaire.");
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
        <h4 style={{ fontSize: '1.2rem', marginBottom: '15px', fontWeight: '600' }}>
          {user ? 'Laissez un commentaire' : "Laissez un commentaire en tant qu'invité"}
        </h4>
        
        {!user && (
          <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '20px' }}>
            Connectez-vous pour commenter plus facilement, ou remplissez les champs ci-dessous pour publier en tant qu'invité.
          </p>
        )}
        
        {error && <div style={{ color: '#dc2626', backgroundColor: '#fee2e2', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px' }}>{error}</div>}
        {success && <div style={{ color: '#059669', backgroundColor: '#d1fae5', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px' }}>{success}</div>}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {!user && (
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 200px' }}>
                <input 
                  type="text" 
                  placeholder="Votre pseudo" 
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
              <div style={{ flex: '1 1 200px' }}>
                <input 
                  type="email" 
                  placeholder="Votre adresse email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
            </div>
          )}
          
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
          
          {!user && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '5px' }}>
              <input 
                type="checkbox" 
                id="cgu_accept"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                required
                style={{ marginTop: '4px', cursor: 'pointer' }}
              />
              <label htmlFor="cgu_accept" style={{ fontSize: '0.9rem', color: '#4b5563', cursor: 'pointer', lineHeight: '1.4' }}>
                J'ai lu et j'accepte les <Link href="/cgu" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>Conditions Générales d'Utilisation</Link> et la <Link href="/politique-de-confidentialite" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>Politique de Confidentialité</Link>.
              </label>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
            {!user ? (
              <div style={{ fontSize: '0.9rem' }}>
                Déjà inscrit ? <Link href="/auth/login" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Connectez-vous</Link>
              </div>
            ) : (
              <div style={{ fontSize: '0.9rem', color: '#4b5563' }}>
                Connecté en tant que <strong>{user.user_metadata?.name || user.user_metadata?.full_name || user.email}</strong>
              </div>
            )}
            <button 
              type="submit" 
              disabled={isSubmitting || (!user && !acceptedTerms)}
              style={{
                backgroundColor: (isSubmitting || (!user && !acceptedTerms)) ? '#9ca3af' : 'var(--color-primary)',
                color: 'white',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '15px',
                cursor: (isSubmitting || (!user && !acceptedTerms)) ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
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
