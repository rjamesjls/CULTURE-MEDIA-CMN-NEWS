'use client';

import React, { useEffect } from 'react';

export default function DashboardError({ error, reset }) {
  useEffect(() => {
    console.error('Admin Dashboard Error:', error);
  }, [error]);

  return (
    <div style={{
      padding: '60px 20px',
      textAlign: 'center',
      fontFamily: 'var(--font-heading)',
      maxWidth: '600px',
      margin: '40px auto',
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      border: '1px solid #fee2e2'
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        backgroundColor: '#fee2e2',
        color: '#ef4444',
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '28px',
        marginBottom: '20px'
      }}>
        <i className="fas fa-exclamation-triangle"></i>
      </div>
      <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#111827', marginBottom: '10px' }}>
        Une erreur est survenue sur le tableau de bord
      </h2>
      <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.6', marginBottom: '25px' }}>
        {error?.message || 'Impossible de charger les données du tableau de bord.'}
      </p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button
          onClick={() => reset()}
          style={{
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: 'none',
            padding: '10px 22px',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          <i className="fas fa-redo-alt" style={{ marginRight: '8px' }}></i>
          Réessayer
        </button>
        <a
          href="/admin/articles"
          style={{
            backgroundColor: '#f1f5f9',
            color: '#334155',
            textDecoration: 'none',
            padding: '10px 22px',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '14px',
            display: 'inline-flex',
            alignItems: 'center'
          }}
        >
          Aller aux articles
        </a>
      </div>
    </div>
  );
}
