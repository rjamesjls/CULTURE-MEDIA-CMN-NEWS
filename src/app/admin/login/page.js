'use client';

import { useState } from 'react';
import { login } from './actions';

export default function LoginPage() {
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    const formData = new FormData(e.target);
    const result = await login(formData);

    if (result?.error) {
      setErrorMsg(result.error);
      setIsSubmitting(false);
    }
  };

  const handleSignup = async () => {
    const form = document.getElementById('login-form');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    
    setIsSubmitting(true);
    setErrorMsg('');

    const formData = new FormData(form);
    const { signup } = await import('./actions');
    const result = await signup(formData);

    if (result?.error) {
      setErrorMsg(result.error);
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6' }}>
      <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <img src="/assets/logo.png" alt="A FOLUKU TV" style={{ height: '40px', margin: '0 auto 20px auto' }} />
          <h1 style={{ fontSize: '24px', fontFamily: 'var(--font-heading)', color: '#111827', margin: 0 }}>Espace Administration</h1>
          <p style={{ color: '#6b7280', marginTop: '5px' }}>Connectez-vous pour continuer</p>
        </div>

        <form id="login-form" onSubmit={handleSubmit}>
          {errorMsg && (
            <div style={{ padding: '10px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '4px', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>
              {errorMsg}
            </div>
          )}

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#374151', fontSize: '14px' }}>Email</label>
            <input 
              type="email" 
              name="email" 
              required 
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #d1d5db' }}
            />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#374151', fontSize: '14px' }}>Mot de passe</label>
            <input 
              type="password" 
              name="password" 
              required 
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #d1d5db' }}
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            style={{ width: '100%', padding: '12px', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1, marginBottom: '10px' }}
          >
            {isSubmitting ? 'Action en cours...' : 'Se connecter'}
          </button>
          
          <button 
            type="button" 
            onClick={handleSignup}
            disabled={isSubmitting}
            style={{ width: '100%', padding: '12px', backgroundColor: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}
          >
            {isSubmitting ? 'Action en cours...' : 'Créer un compte'}
          </button>
        </form>
      </div>
    </div>
  );
}
