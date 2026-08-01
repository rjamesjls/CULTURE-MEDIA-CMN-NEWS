'use client';

import { useState, useEffect } from 'react';
import { getNewsSources, addNewsSource, deleteNewsSource, fetchRSSFeeds } from './actions';
import Link from 'next/link';

export default function VeilleClient() {
  const [sources, setSources] = useState([]);
  const [feedItems, setFeedItems] = useState([]);
  
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  
  const [isLoadingSources, setIsLoadingSources] = useState(true);
  const [isFetchingFeeds, setIsFetchingFeeds] = useState(false);
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showSourcesPanel, setShowSourcesPanel] = useState(false);

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    setIsLoadingSources(true);
    try {
      const res = await getNewsSources();
      if (res.success) {
        setSources(res.data);
        if (res.data.length > 0) {
          loadFeeds(res.data);
        }
      } else if (res.error === 'TABLE_NOT_FOUND') {
        setErrorMsg("La table news_sources n'existe pas. Veuillez exécuter le script SQL fourni dans Supabase.");
      } else {
        setErrorMsg(res.error);
      }
    } catch (err) {
      setErrorMsg(err.message);
    }
    setIsLoadingSources(false);
  };

  const loadFeeds = async (sourcesList) => {
    if (!sourcesList || sourcesList.length === 0) return;
    setIsFetchingFeeds(true);
    try {
      const res = await fetchRSSFeeds(sourcesList);
      if (res.success) {
        setFeedItems(res.data);
      } else {
        setErrorMsg(res.error);
      }
    } catch (err) {
      setErrorMsg("Erreur lors de la récupération des flux.");
    }
    setIsFetchingFeeds(false);
  };

  const handleAddSource = async (e) => {
    e.preventDefault();
    if (!newSourceName.trim() || !newSourceUrl.trim()) return;

    setIsAddingSource(true);
    setErrorMsg('');
    try {
      const res = await addNewsSource(newSourceName, newSourceUrl);
      if (res.success) {
        setNewSourceName('');
        setNewSourceUrl('');
        const updatedSources = [res.data, ...sources];
        setSources(updatedSources);
        loadFeeds(updatedSources);
      } else {
        setErrorMsg(res.error);
      }
    } catch (err) {
      setErrorMsg(err.message);
    }
    setIsAddingSource(false);
  };

  const handleDeleteSource = async (id) => {
    if (!confirm("Voulez-vous vraiment supprimer cette source ?")) return;
    
    try {
      const res = await deleteNewsSource(id);
      if (res.success) {
        const updatedSources = sources.filter(s => s.id !== id);
        setSources(updatedSources);
        setFeedItems(feedItems.filter(item => item.sourceName !== sources.find(s => s.id === id)?.name));
      } else {
        setErrorMsg(res.error);
      }
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div>
      {errorMsg && (
        <div style={{ padding: '15px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '6px', marginBottom: '20px' }}>
          {errorMsg}
        </div>
      )}

      {/* Header actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button 
          onClick={() => loadFeeds(sources)} 
          className="admin-btn"
          disabled={isFetchingFeeds || sources.length === 0}
          style={{ backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', display: 'flex', gap: '8px', alignItems: 'center' }}
        >
          <i className={`fas fa-sync-alt ${isFetchingFeeds ? 'fa-spin' : ''}`}></i>
          {isFetchingFeeds ? 'Actualisation...' : 'Actualiser le fil'}
        </button>

        <button 
          onClick={() => setShowSourcesPanel(!showSourcesPanel)}
          className="admin-btn admin-btn-primary"
          style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
        >
          <i className="fas fa-rss"></i>
          {showSourcesPanel ? 'Masquer les sources' : 'Gérer mes sources RSS'}
        </button>
      </div>

      {/* Sources Management Panel */}
      {showSourcesPanel && (
        <div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px', marginBottom: '30px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '18px' }}>Mes Sources d'information (Flux RSS)</h3>
          
          <form onSubmit={handleAddSource} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input 
              type="text" 
              placeholder="Nom (ex: Le Monde)" 
              value={newSourceName}
              onChange={e => setNewSourceName(e.target.value)}
              className="admin-form-control"
              style={{ flex: 1 }}
              required
            />
            <input 
              type="url" 
              placeholder="URL du flux RSS (ex: https://www.lemonde.fr/rss/une.xml)" 
              value={newSourceUrl}
              onChange={e => setNewSourceUrl(e.target.value)}
              className="admin-form-control"
              style={{ flex: 2 }}
              required
            />
            <button type="submit" className="admin-btn admin-btn-primary" disabled={isAddingSource}>
              {isAddingSource ? 'Ajout...' : 'Ajouter'}
            </button>
          </form>

          {isLoadingSources ? (
            <p>Chargement des sources...</p>
          ) : sources.length === 0 ? (
            <p style={{ color: '#6b7280', fontStyle: 'italic' }}>Aucune source configurée pour le moment.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {sources.map(source => (
                <li key={source.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #f3f4f6', alignItems: 'center' }}>
                  <div>
                    <strong>{source.name}</strong> <br />
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>{source.url}</span>
                  </div>
                  <button onClick={() => handleDeleteSource(source.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '5px' }}>
                    <i className="fas fa-trash"></i>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* News Feed Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {isFetchingFeeds && feedItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            <i className="fas fa-circle-notch fa-spin fa-2x mb-3"></i>
            <p>Récupération des dernières actualités...</p>
          </div>
        ) : feedItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px dashed #d1d5db' }}>
            <i className="fas fa-newspaper fa-3x mb-3" style={{ color: '#9ca3af' }}></i>
            <h3>Aucune actualité</h3>
            <p style={{ color: '#6b7280' }}>Ajoutez des sources RSS pour voir les actualités apparaître ici.</p>
          </div>
        ) : (
          feedItems.map((item, index) => (
            <div key={`${item.id}-${index}`} style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '12px' }}>
                  <span style={{ backgroundColor: '#f3f4f6', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', color: '#374151' }}>
                    {item.sourceName}
                  </span>
                  <span style={{ color: '#6b7280' }}>
                    <i className="far fa-clock"></i> {formatDate(item.pubDate)}
                  </span>
                </div>
                
                <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', lineHeight: '1.4' }}>
                  <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ color: '#111827', textDecoration: 'none' }}>
                    {item.title}
                  </a>
                </h3>
                
                <p style={{ margin: '0 0 15px 0', color: '#4b5563', fontSize: '14px', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} dangerouslySetInnerHTML={{ __html: item.description }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f3f4f6', paddingTop: '15px' }}>
                  <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontSize: '14px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    Lire l'article original <i className="fas fa-external-link-alt" style={{ fontSize: '10px' }}></i>
                  </a>
                  
                  <Link 
                    href={`/admin/ai-generator?subject=${encodeURIComponent(item.title)}&context=${encodeURIComponent("Source : " + item.link)}`}
                    className="admin-btn"
                    style={{ backgroundColor: '#8b5cf6', color: '#fff', padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <i className="fas fa-magic"></i> Générer un article IA
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
