'use client';

import { useState } from 'react';
import Link from 'next/link';
import DeleteButton from './DeleteButton';
import ToggleStatusButton from './ToggleStatusButton';
import { LayoutGrid, List, Search, Kanban, Calendar } from 'lucide-react';
import KanbanView from './KanbanView';
import CalendarView from './CalendarView';
import { updateArticleStatus } from '../../actions';

export default function ArticleList({ initialArticles, categories }) {
  const [view, setView] = useState('list'); // 'list' or 'grid'
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '' = all, 'published' = published, 'draft' = draft

  // Filtrage
  const filteredArticles = initialArticles.filter((article) => {
    const matchesSearch = article.title?.toLowerCase().includes(searchTerm.toLowerCase());
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
            <option value="pending">En attente</option>
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
          <button 
            onClick={() => setView('kanban')}
            style={{ padding: '6px 10px', borderRadius: '4px', border: 'none', background: view === 'kanban' ? '#fff' : 'transparent', color: view === 'kanban' ? '#111827' : '#6b7280', cursor: 'pointer', boxShadow: view === 'kanban' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Kanban size={18} /> Kanban
          </button>
          <button 
            onClick={() => setView('calendar')}
            style={{ padding: '6px 10px', borderRadius: '4px', border: 'none', background: view === 'calendar' ? '#fff' : 'transparent', color: view === 'calendar' ? '#111827' : '#6b7280', cursor: 'pointer', boxShadow: view === 'calendar' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Calendar size={18} /> Calendrier
          </button>
        </div>
      </div>

      {/* Affichage Kanban */}
      {view === 'kanban' && (
        <KanbanView 
          articles={filteredArticles} 
          onStatusChange={async (id, newStatus) => {
            try {
              await updateArticleStatus(id, newStatus);
            } catch (err) {
              alert("Erreur: " + err.message);
            }
          }} 
        />
      )}

      {/* Affichage Calendrier */}
      {view === 'calendar' && (
        <CalendarView articles={filteredArticles} />
      )}

      {/* Affichage Vue Grille */}
      {view === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {filteredArticles.map((article) => (
            <div key={article.id} className="article-grid-card">
              <div style={{ height: '180px', backgroundColor: '#f3f4f6', backgroundImage: article.image_url ? `url(${article.image_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                {!article.image_url && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af' }}>Sans image</div>}
                
                {article.status === 'draft' ? (
                  <span className="admin-badge badge-yellow" style={{ position: 'absolute', top: '12px', left: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    Brouillon
                  </span>
                ) : article.status === 'pending' ? (
                  <span className="admin-badge" style={{ position: 'absolute', top: '12px', left: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', backgroundColor: '#ffedd5', color: '#9a3412' }}>
                    En attente
                  </span>
                ) : (
                  <span className="admin-badge badge-blue" style={{ position: 'absolute', top: '12px', left: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
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
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>{article.pub_date ? new Date(article.pub_date).toLocaleDateString('fr-FR') : 'Date inconnue'}</span>
                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>{article.author}</span>
                    <span style={{ fontSize: '11px', color: '#10b981', marginTop: '4px', fontWeight: '600' }}><i className="fas fa-eye"></i> {article.views_count || 0}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Link 
                      href={`/admin/articles/${article.id}/insights`}
                      className="btn-icon" 
                      title="Statistiques (Insights)" 
                      style={{ padding: '6px', backgroundColor: '#eff6ff', color: '#2563eb' }}
                    >
                      <i className="fas fa-chart-bar"></i>
                    </Link>
                    <Link 
                      href={`/admin/articles/${article.id}/social`}
                      className="btn-icon" 
                      title="Générateur Réseaux Sociaux" 
                      style={{ padding: '6px', backgroundColor: '#fdf4ff', color: '#c026d3' }}
                    >
                      <i className="fas fa-share-alt"></i>
                    </Link>
                    <Link 
                      href={`/fr/article/${article.slug}`}
                      target="_blank"
                      className="btn-icon" 
                      title="Prévisualiser" 
                      style={{ padding: '6px', backgroundColor: '#e0e7ff', color: '#4f46e5' }}
                    >
                      <i className="fas fa-eye"></i>
                    </Link>
                    <Link href={`/admin/articles/edit/${article.id}`} className="btn-icon btn-edit" title="Modifier" style={{ padding: '6px' }}>
                      <i className="fas fa-pen"></i>
                    </Link>
                    <ToggleStatusButton id={article.id} currentStatus={article.status} />
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
                <th>Vues</th>
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
                      <span className="admin-badge badge-yellow">Brouillon</span>
                    ) : article.status === 'pending' ? (
                      <span className="admin-badge badge-orange" style={{ backgroundColor: '#ffedd5', color: '#9a3412' }}>En attente</span>
                    ) : (
                      <span className="admin-badge badge-green">Publié</span>
                    )}
                  </td>
                  <td>{article.author}</td>
                  <td>
                    <span style={{ color: '#10b981', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <i className="fas fa-eye"></i> {article.views_count || 0}
                    </span>
                  </td>
                  <td>{article.pub_date ? new Date(article.pub_date).toLocaleDateString('fr-FR') : 'Date inconnue'}</td>
                  <td>
                    <div className="admin-actions" style={{ justifyContent: 'flex-end', display: 'flex', gap: '5px' }}>
                      <Link 
                        href={`/admin/articles/${article.id}/insights`}
                        className="btn-icon" 
                        title="Statistiques (Insights)" 
                        style={{ padding: '4px 8px', backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}
                      >
                        <i className="fas fa-chart-bar"></i>
                      </Link>
                      <Link 
                        href={`/admin/articles/${article.id}/social`}
                        className="btn-icon" 
                        title="Générateur Réseaux Sociaux" 
                        style={{ padding: '4px 8px', backgroundColor: '#fdf4ff', color: '#c026d3', border: '1px solid #f0abfc' }}
                      >
                        <i className="fas fa-share-alt"></i>
                      </Link>
                      <Link 
                        href={`/fr/article/${article.slug}`}
                        target="_blank"
                        className="btn-icon" 
                        title="Prévisualiser" 
                        style={{ padding: '4px 8px', backgroundColor: '#e0e7ff', color: '#4f46e5', border: '1px solid #c7d2fe' }}
                      >
                        <i className="fas fa-eye"></i>
                      </Link>
                      <Link href={`/admin/articles/edit/${article.id}`} className="btn-icon btn-edit" title="Modifier">
                        <i className="fas fa-pen"></i>
                      </Link>
                      <ToggleStatusButton id={article.id} currentStatus={article.status} />
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
