'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function KanbanView({ articles, onStatusChange }) {
  const [draggedArticle, setDraggedArticle] = useState(null);

  const columns = [
    { id: 'draft', title: 'Brouillons', color: '#fde68a', textColor: '#92400e' },
    { id: 'pending', title: 'En attente', color: '#fed7aa', textColor: '#9a3412' },
    { id: 'published', title: 'Publiés', color: '#bbf7d0', textColor: '#166534' }
  ];

  const handleDragStart = (article) => {
    setDraggedArticle(article);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (status) => {
    if (draggedArticle && draggedArticle.status !== status) {
      onStatusChange(draggedArticle.id, status);
    }
    setDraggedArticle(null);
  };

  return (
    <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '10px' }}>
      {columns.map(col => {
        const colArticles = articles.filter(a => a.status === col.id);
        
        return (
          <div 
            key={col.id} 
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(col.id)}
            style={{ 
              flex: 1, 
              minWidth: '300px', 
              backgroundColor: '#f9fafb', 
              borderRadius: '8px', 
              border: '1px solid #e5e7eb',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '70vh'
            }}
          >
            <div style={{ padding: '15px', borderBottom: '1px solid #e5e7eb', backgroundColor: col.color, borderRadius: '8px 8px 0 0' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: col.textColor, display: 'flex', justifyContent: 'space-between' }}>
                {col.title}
                <span style={{ backgroundColor: 'rgba(255,255,255,0.5)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
                  {colArticles.length}
                </span>
              </h3>
            </div>
            
            <div style={{ padding: '15px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {colArticles.map(article => (
                <div 
                  key={article.id}
                  draggable
                  onDragStart={() => handleDragStart(article)}
                  style={{
                    backgroundColor: '#fff',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    cursor: 'grab'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase' }}>{article.category}</span>
                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>{new Date(article.pub_date).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', lineHeight: '1.4' }}>
                    <Link href={`/admin/articles/edit/${article.id}`} style={{ color: '#111827', textDecoration: 'none' }}>
                      {article.title}
                    </Link>
                  </h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      <i className="fas fa-user" style={{ marginRight: '5px' }}></i>
                      {article.author}
                    </span>
                    <Link href={`/admin/articles/edit/${article.id}`} style={{ color: '#2563eb', fontSize: '12px', textDecoration: 'none' }}>
                      Éditer <i className="fas fa-arrow-right"></i>
                    </Link>
                  </div>
                </div>
              ))}
              {colArticles.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af', fontSize: '13px', fontStyle: 'italic' }}>
                  Aucun article
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
