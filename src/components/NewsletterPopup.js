'use client';

import { useState, useEffect } from 'react';
import { subscribeToNewsletter } from '@/app/actions/newsletter';

export default function NewsletterPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check if the user has already seen or closed the popup
    const hasSeenPopup = localStorage.getItem('cmn_newsletter_popup_closed');
    const hasSubscribed = localStorage.getItem('cmn_newsletter_subscribed');

    if (!hasSeenPopup && !hasSubscribed) {
      // Show popup after a short delay (e.g., 5 seconds)
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 5000);
      
      const handleOpenPopup = () => setIsOpen(true);
      window.addEventListener('open-newsletter-popup', handleOpenPopup);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('open-newsletter-popup', handleOpenPopup);
      };
    } else {
      const handleOpenPopup = () => setIsOpen(true);
      window.addEventListener('open-newsletter-popup', handleOpenPopup);
      return () => {
        window.removeEventListener('open-newsletter-popup', handleOpenPopup);
      };
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    // Don't show again for a while (or forever)
    localStorage.setItem('cmn_newsletter_popup_closed', 'true');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: '', message: '' });

    const formData = new FormData();
    formData.append('email', email);

    const result = await subscribeToNewsletter(formData);

    if (result?.error) {
      setStatus({ type: 'error', message: result.error });
    } else if (result?.success || result?.success === undefined) {
      // If success is undefined, it means success (as per the action's logic returning { success: true } or nothing sometimes)
      setStatus({ type: 'success', message: result.message || 'Merci pour votre inscription !' });
      localStorage.setItem('cmn_newsletter_subscribed', 'true');
      
      // Close popup automatically after a few seconds
      setTimeout(() => {
        setIsOpen(false);
      }, 3000);
    } else if (result?.success === false) {
      setStatus({ type: 'error', message: result.message });
      if (result.message.includes('déjà abonné')) {
        localStorage.setItem('cmn_newsletter_subscribed', 'true');
      }
    }
    
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        padding: '30px',
        maxWidth: '450px',
        width: '100%',
        position: 'relative',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        animation: 'popIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <button 
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            color: '#6b7280',
            cursor: 'pointer',
            lineHeight: '1'
          }}
        >
          &times;
        </button>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ 
            width: '60px', height: '60px', 
            backgroundColor: 'var(--color-primary, #e60000)', 
            color: 'white', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontSize: '24px',
            margin: '0 auto 15px auto'
          }}>
            <i className="fas fa-paper-plane"></i>
          </div>
          <h2 style={{ margin: '0 0 10px 0', color: '#111827', fontFamily: 'var(--font-heading)' }}>
            Restez toujours informés !
          </h2>
          <p style={{ margin: 0, color: '#4b5563', fontSize: '15px', lineHeight: '1.5' }}>
            Abonnez-vous à notre newsletter pour recevoir les dernières actualités et contenus exclusifs de A FOLUKU TV directement dans votre boîte mail.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Votre adresse email" 
            required 
            style={{ 
              padding: '12px 15px', 
              borderRadius: '8px', 
              border: '1px solid #d1d5db',
              fontSize: '16px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary, #e60000)'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
          <button 
            type="submit" 
            disabled={isSubmitting}
            style={{ 
              padding: '12px 15px', 
              backgroundColor: 'var(--color-primary, #e60000)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              fontWeight: 'bold', 
              fontSize: '16px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
              transition: 'background-color 0.2s'
            }}
          >
            {isSubmitting ? 'Inscription en cours...' : 'Je m\'abonne'}
          </button>
        </form>

        {status.message && (
          <div style={{ 
            marginTop: '15px', 
            padding: '10px', 
            borderRadius: '6px', 
            backgroundColor: status.type === 'error' ? '#fee2e2' : '#dcfce7',
            color: status.type === 'error' ? '#991b1b' : '#166534',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {status.message}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '15px' }}>
          <button 
            onClick={handleClose}
            style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Non merci, je souhaite juste lire les articles.
          </button>
        </div>

      </div>
      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
