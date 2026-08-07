'use client';

import { useState } from 'react';
import { subscribeToNewsletter } from '@/app/actions/newsletter';

export default function NewsletterForm({ 
  title = "Newsletter", 
  description = "Restez informé de nos derniers articles", 
  placeholder = "Votre adresse email", 
  buttonText = "S'abonner", 
  buttonSubmitting = "Inscription..." 
}) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: '', message: '' });

    const formData = new FormData();
    formData.append('email', email);

    const result = await subscribeToNewsletter(formData);

    if (result?.error) {
      setStatus({ type: 'error', message: result.error });
    } else if (result?.success) {
      setStatus({ type: 'success', message: result.message });
      setEmail('');
    } else if (result?.success === false) {
      setStatus({ type: 'error', message: result.message });
    }
    
    setIsSubmitting(false);
  };

  return (
    <div style={{ marginTop: '20px' }}>
      <h4 style={{ color: 'var(--color-primary)' }}>{title}</h4>
      <p style={{ color: 'var(--color-gray-400)', fontSize: '14px', marginBottom: '10px' }}>{description}</p>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder}
          required 
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #374151', backgroundColor: '#1f2937', color: 'white' }}
        />
        <button 
          type="submit" 
          disabled={isSubmitting}
          style={{ padding: '10px', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
        >
          {isSubmitting ? buttonSubmitting : buttonText}
        </button>
      </form>
      {status.message && (
        <div style={{ marginTop: '10px', fontSize: '13px', color: status.type === 'error' ? '#ef4444' : '#10b981' }}>
          {status.message}
        </div>
      )}
    </div>
  );
}
