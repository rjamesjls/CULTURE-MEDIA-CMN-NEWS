"use client";

import { useState } from 'react';
import { submitContactMessage } from '@/app/contact/actions';

export default function ContactForm() {
  const [status, setStatus] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg(null);
    
    const formData = new FormData(e.target);
    const result = await submitContactMessage(formData);
    
    if (result.success) {
      setStatus('success');
      e.target.reset();
    } else {
      setStatus('error');
      setErrorMsg(result.error || "Une erreur est survenue");
    }
  };

  return (
    <div className="modern-contact-form" style={{ 
      marginTop: '60px', 
      padding: '40px', 
      backgroundColor: '#ffffff', 
      borderRadius: '16px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
      border: '1px solid rgba(0,0,0,0.05)'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 style={{ 
          fontFamily: 'var(--font-heading)', 
          fontSize: '1.8rem',
          fontWeight: '700',
          color: 'var(--color-dark)',
          marginBottom: '10px'
        }}>Envoyer votre message</h2>
        <p style={{ color: 'var(--color-gray-600)', fontSize: '1rem' }}>
          Nous vous répondrons dans les plus brefs délais.
        </p>
      </div>

      {status === 'success' ? (
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#ecfdf5', 
          color: '#065f46', 
          borderRadius: '12px',
          textAlign: 'center',
          fontWeight: '500',
          animation: 'fadeIn 0.5s ease-out'
        }}>
          ✨ Votre message a bien été envoyé ! Merci de nous avoir contactés.
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {status === 'error' && (
            <div style={{
              padding: '15px',
              backgroundColor: '#fef2f2',
              color: '#991b1b',
              borderRadius: '10px',
              border: '1px solid #f87171',
              fontSize: '0.95rem'
            }}>
              {errorMsg}
            </div>
          )}
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label htmlFor="firstName" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem', color: 'var(--color-gray-800)' }}>Prénom <span style={{ color: 'var(--color-error)' }}>*</span></label>
              <input type="text" id="firstName" name="firstName" required style={{ 
                width: '100%', 
                padding: '12px 16px', 
                border: '2px solid #e5e7eb', 
                borderRadius: '10px',
                fontSize: '1rem',
                transition: 'all 0.2s',
                outline: 'none'
              }} 
              onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              placeholder="Jean"
              />
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label htmlFor="lastName" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem', color: 'var(--color-gray-800)' }}>Nom <span style={{ color: 'var(--color-error)' }}>*</span></label>
              <input type="text" id="lastName" name="lastName" required style={{ 
                width: '100%', 
                padding: '12px 16px', 
                border: '2px solid #e5e7eb', 
                borderRadius: '10px',
                fontSize: '1rem',
                transition: 'all 0.2s',
                outline: 'none'
              }} 
              onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              placeholder="Dupont"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem', color: 'var(--color-gray-800)' }}>Email <span style={{ color: 'var(--color-error)' }}>*</span></label>
            <input type="email" id="email" name="email" required style={{ 
              width: '100%', 
              padding: '12px 16px', 
              border: '2px solid #e5e7eb', 
              borderRadius: '10px',
              fontSize: '1rem',
              transition: 'all 0.2s',
              outline: 'none'
            }} 
            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            placeholder="jean.dupont@email.com"
            />
          </div>

          <div>
            <label htmlFor="message" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem', color: 'var(--color-gray-800)' }}>Message</label>
            <textarea id="message" name="message" rows="5" style={{ 
              width: '100%', 
              padding: '12px 16px', 
              border: '2px solid #e5e7eb', 
              borderRadius: '10px',
              fontSize: '1rem',
              transition: 'all 0.2s',
              outline: 'none',
              resize: 'vertical'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            placeholder="Votre message ici..."
            ></textarea>
          </div>

          <div>
            <label htmlFor="attachment" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem', color: 'var(--color-gray-800)' }}>Pièce jointe (Optionnel)</label>
            <input type="file" id="attachment" name="attachment" accept="image/*,audio/*,video/*,.pdf" style={{ 
              width: '100%', 
              padding: '10px 14px', 
              border: '2px dashed #e5e7eb', 
              borderRadius: '10px',
              fontSize: '0.95rem',
              transition: 'all 0.2s',
              outline: 'none',
              backgroundColor: '#f9fafb',
              cursor: 'pointer'
            }} 
            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
            <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '6px' }}>Formats acceptés: Images, Musiques, Vidéos, PDF. Max 10Mo.</p>
          </div>


          <button 
            type="submit" 
            disabled={status === 'loading'}
            style={{ 
              padding: '14px 28px', 
              backgroundColor: 'var(--color-dark)', 
              color: 'var(--color-primary)', 
              border: 'none', 
              borderRadius: '10px', 
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '1rem',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              width: '100%',
              opacity: status === 'loading' ? 0.7 : 1,
              marginTop: '10px',
              boxShadow: '0 4px 14px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              if (status !== 'loading') {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
              }
            }}
            onMouseLeave={(e) => {
              if (status !== 'loading') {
                e.target.style.transform = 'none';
                e.target.style.boxShadow = '0 4px 14px rgba(0,0,0,0.1)';
              }
            }}
          >
            {status === 'loading' ? (
              <>
                <svg className="animate-spin" style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Envoi en cours...
              </>
            ) : (
              'Envoyer le message'
            )}
          </button>
        </form>
      )}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
