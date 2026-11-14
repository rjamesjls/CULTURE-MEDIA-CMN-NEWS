'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DeleteButton from './DeleteButton';
import ToggleStatusButton from './ToggleStatusButton';
import { LayoutGrid, List, Search, Kanban, Calendar } from 'lucide-react';
import KanbanView from './KanbanView';
import CalendarView from './CalendarView';
import { updateArticleStatus, updateArticlePubDate } from '../../actions';
import PrivateShareModal from '@/components/admin/PrivateShareModal';

export default function ArticleList({ initialArticles, categories }) {
  const [articles, setArticles] = useState(initialArticles || []);
  const [view, setView] = useState('list'); // 'list' or 'grid'
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '' = all, 'published' = published, 'draft' = draft, 'private' = private
  const [selectedPrivateArticle, setSelectedPrivateArticle] = useState(null);
  const [selectedDateArticle, setSelectedDateArticle] = useState(null);

  useEffect(() => {
    setArticles(initialArticles || []);
  }, [initialArticles]);

  // Filtrage
  const filteredArticles = articles.filter((article) => {
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
            <option value="private">Privés (Protégés par code)</option>
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
                
                {article.status === 'private' ? (
                  <span className="admin-badge" style={{ position: 'absolute', top: '12px', left: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', backgroundColor: '#f3e8ff', color: '#7e22ce', border: '1px solid #d8b4fe' }}>
                    <i className="fas fa-lock" style={{ marginRight: '4px' }}></i> Privé
                  </span>
                ) : article.status === 'draft' ? (
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
                  {article.seo_metadata?.private_access?.enabled && (
                    <span title="Accès privé par code actif" style={{ marginLeft: '6px', color: '#d97706', fontSize: '12px' }}>
                      <i className="fas fa-key"></i>
                    </span>
                  )}
                </h4>
                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #f3f4f6' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedDateArticle(article)}
                      title="Modifier la date de publication manuellement"
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#4b5563',
                        fontSize: '12px',
                        fontWeight: '500',
                        textAlign: 'left'
                      }}
                    >
                      <i className="far fa-calendar-alt" style={{ color: '#dc2626' }}></i>
                      <span>{article.pub_date ? new Date(article.pub_date).toLocaleDateString('fr-FR') : 'Date inconnue'}</span>
                      <i className="fas fa-pen" style={{ fontSize: '9px', color: '#9ca3af', marginLeft: '2px' }}></i>
                    </button>
                    <span style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{article.author}</span>
                    <div style={{ display: 'flex', gap: '10px', fontSize: '11px', marginTop: '4px', fontWeight: '600' }}>
                      <span style={{ color: '#10b981' }} title="Vues"><i className="fas fa-eye"></i> {article.views_count || 0}</span>
                      <span style={{ color: '#f43f5e' }} title="Likes"><i className="fas fa-heart"></i> {article.likes_count || 0}</span>
                      <span style={{ color: '#3b82f6' }} title="Partages"><i className="fas fa-share"></i> {article.shares_count || 0}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedPrivateArticle(article)}
                      className="btn-icon"
                      title="Envoyer avec un code de lecture"
                      style={{
                        padding: '6px',
                        backgroundColor: article.seo_metadata?.private_access?.enabled ? '#fef3c7' : '#fef9c3',
                        color: '#b45309',
                        border: '1px solid #fde047',
                        cursor: 'pointer',
                      }}
                    >
                      <i className="fas fa-key"></i>
                    </button>
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
                <th>Stats</th>
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
                    {article.seo_metadata?.private_access?.enabled && (
                      <span title="Accès privé par code actif" style={{ marginLeft: '8px', color: '#d97706', fontSize: '12px' }}>
                        <i className="fas fa-key"></i>
                      </span>
                    )}
                  </td>
                  <td>
                    {article.status === 'private' ? (
                      <span className="admin-badge" style={{ backgroundColor: '#f3e8ff', color: '#7e22ce', border: '1px solid #d8b4fe' }}>
                        <i className="fas fa-lock" style={{ marginRight: '4px' }}></i> Privé
                      </span>
                    ) : article.status === 'draft' ? (
                      <span className="admin-badge badge-yellow">Brouillon</span>
                    ) : article.status === 'pending' ? (
                      <span className="admin-badge badge-orange" style={{ backgroundColor: '#ffedd5', color: '#9a3412' }}>En attente</span>
                    ) : (
                      <span className="admin-badge badge-green">Publié</span>
                    )}
                  </td>
                  <td>{article.author}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', fontWeight: '600', fontSize: '12px' }}>
                      <span style={{ color: '#10b981' }} title="Vues"><i className="fas fa-eye"></i> {article.views_count || 0}</span>
                      <span style={{ color: '#f43f5e' }} title="Likes"><i className="fas fa-heart"></i> {article.likes_count || 0}</span>
                      <span style={{ color: '#3b82f6' }} title="Partages"><i className="fas fa-share"></i> {article.shares_count || 0}</span>
                    </div>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedDateArticle(article)}
                      title="Modifier la date de publication manuellement"
                      style={{
                        background: 'none',
                        border: '1px solid transparent',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: '#374151',
                        fontSize: '13px',
                        fontWeight: '500',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                        e.currentTarget.style.borderColor = '#d1d5db';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.borderColor = 'transparent';
                      }}
                    >
                      <i className="far fa-calendar-alt" style={{ color: '#dc2626' }}></i>
                      <span>{article.pub_date ? new Date(article.pub_date).toLocaleDateString('fr-FR') : 'Date inconnue'}</span>
                      <i className="fas fa-pen" style={{ fontSize: '10px', color: '#9ca3af', marginLeft: '2px' }}></i>
                    </button>
                  </td>
                  <td>
                    <div className="admin-actions" style={{ justifyContent: 'flex-end', display: 'flex', gap: '5px' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedPrivateArticle(article)}
                        className="btn-icon"
                        title="Envoyer avec un code de lecture (Accès privé)"
                        style={{
                          padding: '4px 8px',
                          backgroundColor: article.seo_metadata?.private_access?.enabled ? '#fef3c7' : '#fef9c3',
                          color: '#b45309',
                          border: '1px solid #fde047',
                          cursor: 'pointer',
                        }}
                      >
                        <i className="fas fa-key"></i>
                      </button>
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

      {/* Modal Partage Privé avec code de lecture */}
      {selectedPrivateArticle && (
        <PrivateShareModal
          isOpen={!!selectedPrivateArticle}
          article={selectedPrivateArticle}
          onClose={() => setSelectedPrivateArticle(null)}
          onUpdated={(updated) => {
            // Mise à jour locale de l'article pour réactivité immédiate
            if (selectedPrivateArticle) {
              const currentAccess = selectedPrivateArticle.seo_metadata?.private_access || {};
              selectedPrivateArticle.seo_metadata = {
                ...(selectedPrivateArticle.seo_metadata || {}),
                private_access: {
                  ...currentAccess,
                  ...updated,
                },
              };
              if (updated.is_private_only) {
                selectedPrivateArticle.status = 'private';
              } else if (updated.status) {
                selectedPrivateArticle.status = updated.status;
              } else if (updated.enabled === false && selectedPrivateArticle.status === 'private') {
                selectedPrivateArticle.status = 'published';
              }
            }
          }}
        />
      )}

      {/* Modal Modification Date de Publication */}
      {selectedDateArticle && (
        <DateEditModal
          article={selectedDateArticle}
          onClose={() => setSelectedDateArticle(null)}
          onSaved={(newPubDate) => {
            setArticles(prev => prev.map(a => a.id === selectedDateArticle.id ? { ...a, pub_date: newPubDate } : a));
            setSelectedDateArticle(null);
          }}
        />
      )}
    </div>
  );
}

function DateEditModal({ article, onClose, onSaved }) {
  const formatToDatetimeLocal = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const [dateVal, setDateVal] = useState(formatToDatetimeLocal(article?.pub_date || new Date().toISOString()));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    if (!dateVal) return;
    setSaving(true);
    setError('');
    try {
      const iso = new Date(dateVal).toISOString();
      await updateArticlePubDate(article.id, iso);
      onSaved(iso);
    } catch (err) {
      setError(err.message || 'Erreur lors de la mise à jour de la date');
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '460px',
        width: '100%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="far fa-calendar-alt" style={{ color: '#dc2626' }}></i>
            Date de publication
          </h3>
          <button 
            type="button" 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', fontSize: '20px', color: '#9ca3af', cursor: 'pointer', lineHeight: 1 }}
          >
            &times;
          </button>
        </div>

        <p style={{ fontSize: '13px', color: '#4b5563', margin: '0 0 16px 0', lineHeight: '1.4' }}>
          Article : <strong>{article.title}</strong>
        </p>

        {error && (
          <div style={{ padding: '10px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '6px', fontSize: '13px', marginBottom: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSave}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                Choisir la date et l'heure :
              </label>
              <button
                type="button"
                onClick={() => setDateVal(formatToDatetimeLocal(new Date().toISOString()))}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  fontSize: '12px',
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                  fontWeight: '500'
                }}
              >
                Définir sur Maintenant
              </button>
            </div>
            <input 
              type="datetime-local" 
              className="admin-form-control" 
              value={dateVal}
              onChange={(e) => setDateVal(e.target.value)}
              required
              style={{ width: '100%', margin: 0 }}
            />
            <span style={{ fontSize: '11.5px', color: '#6b7280', marginTop: '6px', display: 'block' }}>
              Vous pouvez antidater ou modifier la parution pour réorganiser l'ordre d'affichage sur le site.
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="admin-btn"
              style={{ backgroundColor: '#f3f4f6', color: '#4b5563' }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="admin-btn admin-btn-primary"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer la date'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
