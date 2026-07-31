'use client';

import { useState } from 'react';
import { deleteComment, toggleCommentStatus } from './actions';
import Link from 'next/link';

export default function CommentsClient({ initialComments }) {
  const [comments, setComments] = useState(initialComments);

  const handleDelete = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer définitivement ce commentaire ?")) return;

    const res = await deleteComment(id);
    if (res.success) {
      setComments(comments.filter(c => c.id !== id));
    } else {
      alert("Erreur: " + res.error);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const res = await toggleCommentStatus(id, currentStatus);
    if (res.success) {
      setComments(comments.map(c => c.id === id ? { ...c, status: res.newStatus } : c));
    } else {
      alert("Erreur: " + res.error);
    }
  };

  return (
    <div className="admin-content-card">
      <div className="admin-header">
        <h1 className="admin-title"><i className="fas fa-comments" style={{ color: 'var(--color-primary)' }}></i> Modération des Commentaires</h1>
      </div>
      
      {comments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          Aucun commentaire pour le moment.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
          {comments.map((comment) => (
            <div key={comment.id} style={{ 
              backgroundColor: '#fff', 
              borderRadius: '8px', 
              border: '1px solid #e5e7eb',
              padding: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '20px'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '15px' }}>{comment.author_name}</span>
                  <span style={{ color: '#9ca3af', fontSize: '13px' }}>
                    {new Date(comment.created_at).toLocaleString('fr-FR')}
                  </span>
                  {comment.status === 'hidden' && (
                    <span className="admin-badge admin-badge-warning" style={{ fontSize: '11px', padding: '2px 6px' }}>Masqué</span>
                  )}
                  {comment.status === 'approved' && (
                    <span className="admin-badge admin-badge-success" style={{ fontSize: '11px', padding: '2px 6px' }}>Approuvé (Public)</span>
                  )}
                </div>
                
                <p style={{ color: '#4b5563', margin: '10px 0', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                  {comment.content}
                </p>
                
                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                  Sur l'article : <Link href={`/article/${comment.articles?.slug}`} target="_blank" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: '500' }}>{comment.articles?.title}</Link>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button 
                  onClick={() => handleToggleStatus(comment.id, comment.status)}
                  className="admin-btn"
                  style={{ 
                    backgroundColor: comment.status === 'approved' ? '#fef3c7' : '#d1fae5', 
                    color: comment.status === 'approved' ? '#92400e' : '#065f46', 
                    border: 'none',
                    width: '100%'
                  }}
                >
                  <i className={comment.status === 'approved' ? "fas fa-eye-slash" : "fas fa-eye"}></i> 
                  {comment.status === 'approved' ? " Masquer" : " Approuver"}
                </button>
                <button 
                  onClick={() => handleDelete(comment.id)}
                  className="admin-btn"
                  style={{ backgroundColor: '#fee2e2', color: '#b91c1c', border: 'none', width: '100%' }}
                >
                  <i className="fas fa-trash"></i> Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
