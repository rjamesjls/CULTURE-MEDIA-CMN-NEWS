'use client';

import { useState } from 'react';
import Link from 'next/link';
import DeleteButton from './DeleteButton';
import { LayoutGrid, List, Search } from 'lucide-react';

export default function ArticleList({ initialArticles, categories }) {
  const [view, setView] = useState('list'); // 'list' or 'grid'
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '' = all, 'published' = published, 'draft' = draft

  // Filtrage
  const filteredArticles = initialArticles.filter((article) => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter ? article.category === categoryFilter : true;
    const matchesStatus = statusFilter ? article.status === statusFilter : true;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div>
      {/* Barre de contrôle : Filtres et Vues */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '15px', flexWrap: 'wrap' }}>
        
        <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '300px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Rechercher par titre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-form-control"
              style={{ paddingLeft: '35px', margin: 0 }}
            />
          </div>
          
          <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="admin-form-control"
            style={{ width: 'auto', margin: 0 }}
          >
            <option value="">Toutes les catégories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>

          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin-form-control"
            style={{ width: 'auto', margin: 0 }}
          >
            <option value="">Tous les statuts</option>
            <option value="published">Publiés</option>
            <option value="draft">Brouillons</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '5px', backgroundColor: '#e5e7eb', padding: '3px', borderRadius: '6px' }}>
          <button 
            onClick={() => setView('list')}
            style={{ padding: '6px 10px', borderRadius: '4px', border: 'none', background: view === 'list' ? '#fff' : 'transparent', color: view === 'list' ? '#111827' : '#6b7280', cursor: 'pointer', boxShadow: view === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <List size={18} /> Liste
          </button>
          <button 
            onClick={() => setView('grid')}
            style={{ padding: '6px 10px', borderRadius: '4px', border: 'none', background: view === 'grid' ? '#fff' : 'transparent', color: view === 'grid' ? '#111827' : '#6b7280', cursor: 'pointer', boxShadow: view === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <LayoutGrid size={18} /> Grille
          </button>
        </div>
      </div>

      {/* Affichage Vue Grille */}
      {view === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {filteredArticles.map((article) => (
            <div key={article.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#fff', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: '160px', backgroundColor: '#f3f4f6', backgroundImage: article.image_url ? `url(${article.image_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                {!article.image_url && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af' }}>Sans image</div>}
                
                {article.status === 'draft' ? (
                  <span style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: '#fef3c7', color: '#92400e', padding: '2px 8px', fontSize: '12px', borderRadius: '4px', fontWeight: 'bold' }}>
                    BROUILLON
                  </span>
                ) : (
                  <span style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', padding: '2px 8px', fontSize: '12px', borderRadius: '4px' }}>
                    {article.category}
                  </span>
                )}
              </div>
              <div style={{ padding: '15px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', lineHeight: '1.4' }}>
                  <a href={`/article/${article.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: '#111827', textDecoration: 'none' }}>
                    {article.title}
                  </a>
                </h4>
                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #f3f4f6' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>{new Date(article.pub_date).toLocaleDateString('fr-FR')}</span>
                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>{article.author}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <Link 
                      href={`/admin/articles/${article.id}/instagram`}
                      className="btn-icon" 
                      title="Créer Post Instagram" 
                      style={{ padding: '4px 8px', backgroundColor: '#fdf4ff', color: '#c026d3', border: '1px solid #f0abfc' }}
                    >
                      <i className="fab fa-instagram"></i>
                    </Link>
                    <Link href={`/admin/articles/edit/${article.id}`} className="btn-icon btn-edit" title="Modifier" style={{ padding: '4px 8px' }}>
                      <i className="fas fa-pen"></i>
                    </Link>
                    <DeleteButton id={article.id} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Affichage Vue Liste */}
      {view === 'list' && (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Statut</th>
                <th>Auteur</th>
                <th>Date de pub.</th>
                <th style={{ width: '130px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredArticles.map((article) => (
                <tr key={article.id}>
                  <td style={{ fontWeight: 500 }}>
                    <a href={`/article/${article.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: '#111827', textDecoration: 'none' }}>
                      {article.title} <i className="fas fa-external-link-alt" style={{ fontSize: '10px', color: '#9ca3af', marginLeft: '5px' }}></i>
                    </a>
                  </td>
                  <td>
                    {article.status === 'draft' ? (
                      <span className="badge" style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '2px 8px', fontSize: '12px', borderRadius: '4px', fontWeight: 'bold' }}>Brouillon</span>
                    ) : (
                      <span className="badge" style={{ backgroundColor: '#d1fae5', color: '#065f46', padding: '2px 8px', fontSize: '12px', borderRadius: '4px' }}>Publié</span>
                    )}
                  </td>
                  <td>{article.author}</td>
                  <td>{new Date(article.pub_date).toLocaleDateString('fr-FR')}</td>
                  <td>
                    <div className="admin-actions" style={{ justifyContent: 'flex-end', display: 'flex', gap: '5px' }}>
                      <Link 
                        href={`/admin/articles/${article.id}/instagram`}
                        className="btn-icon" 
                        title="Créer Post Instagram" 
                        style={{ padding: '4px 8px', backgroundColor: '#fdf4ff', color: '#c026d3', border: '1px solid #f0abfc' }}
                      >
                        <i className="fab fa-instagram"></i>
                      </Link>
                      <Link href={`/admin/articles/edit/${article.id}`} className="btn-icon btn-edit" title="Modifier">
                        <i className="fas fa-pen"></i>
                      </Link>
                      <DeleteButton id={article.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {filteredArticles.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#fff', border: '1px dashed #d1d5db', borderRadius: '8px', color: '#6b7280' }}>
          Aucun article trouvé pour votre recherche.
        </div>
      )}
    </div>
  );
}
