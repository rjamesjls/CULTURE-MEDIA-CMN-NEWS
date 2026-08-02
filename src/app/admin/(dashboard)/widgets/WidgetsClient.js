'use client';

import { useState } from 'react';
import { addWidget, deleteWidget } from './actions';

export default function WidgetsClient({ initialWidgets, tableExists }) {
  const [widgets, setWidgets] = useState(initialWidgets);
  const [activeWidgetId, setActiveWidgetId] = useState(initialWidgets.length > 0 ? initialWidgets[0].id : null);
  
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!tableExists) {
    return (
      <div style={{ padding: '20px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px' }}>
        <strong>Attention :</strong> La table <code>admin_widgets</code> n'existe pas encore dans votre base de données Supabase.
        Veuillez exécuter le script SQL fourni dans l'éditeur Supabase pour activer cette fonctionnalité.
      </div>
    );
  }

  const handleAdd = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const res = await addWidget(newName, newUrl);
    if (res.success) {
      const updatedList = [...widgets, res.widget];
      setWidgets(updatedList);
      setActiveWidgetId(res.widget.id);
      setNewName('');
      setNewUrl('');
      setIsAdding(false);
    } else {
      setError(res.error);
    }
    setIsLoading(false);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer le widget "${name}" ?`)) return;
    
    setIsLoading(true);
    const res = await deleteWidget(id);
    if (res.success) {
      const updatedList = widgets.filter(w => w.id !== id);
      setWidgets(updatedList);
      if (activeWidgetId === id) {
        setActiveWidgetId(updatedList.length > 0 ? updatedList[0].id : null);
      }
    } else {
      alert(res.error);
    }
    setIsLoading(false);
  };

  const activeWidget = widgets.find(w => w.id === activeWidgetId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minHeight: 'calc(100vh - 150px)' }}>
      
      {/* Top Bar: Tabs & Add Button */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '15px', flexWrap: 'wrap' }}>
        {widgets.map(w => (
          <button
            key={w.id}
            onClick={() => setActiveWidgetId(w.id)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: activeWidgetId === w.id ? 'none' : '1px solid #d1d5db',
              backgroundColor: activeWidgetId === w.id ? 'var(--color-primary, #b91c1c)' : '#fff',
              color: activeWidgetId === w.id ? '#fff' : '#4b5563',
              cursor: 'pointer',
              fontWeight: activeWidgetId === w.id ? 'bold' : 'normal',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <i className="fas fa-window-maximize"></i> {w.name}
          </button>
        ))}
        
        <button
          onClick={() => setIsAdding(!isAdding)}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: '1px dashed #9ca3af',
            backgroundColor: '#f9fafb',
            color: '#4b5563',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <i className={`fas fa-${isAdding ? 'times' : 'plus'}`}></i> {isAdding ? 'Annuler' : 'Ajouter un outil'}
        </button>
      </div>

      {/* Add Form */}
      {isAdding && (
        <form onSubmit={handleAdd} style={{ padding: '20px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', maxWidth: '600px' }}>
          <h4 style={{ margin: '0 0 15px 0' }}>Ajouter un nouvel outil externe</h4>
          {error && <div style={{ color: '#b91c1c', marginBottom: '10px', fontSize: '14px' }}>{error}</div>}
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Nom de l'outil</label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex: Google Analytics"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>URL d'intégration</label>
            <input
              type="url"
              required
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://..."
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            />
            <small style={{ color: '#6b7280', display: 'block', marginTop: '5px' }}>
              Assurez-vous que l'URL commence par https://. Certains sites (comme Google.com) n'autorisent pas l'affichage en Iframe.
            </small>
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="admin-btn admin-btn-primary"
          >
            {isLoading ? 'Sauvegarde...' : 'Sauvegarder l\'outil'}
          </button>
        </form>
      )}

      {/* Iframe View */}
      <div style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column' }}>
        {activeWidget ? (
          <>
            <div style={{ backgroundColor: '#f3f4f6', padding: '10px 15px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <strong>{activeWidget.name}</strong>
                <a href={activeWidget.url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', fontSize: '13px', textDecoration: 'none' }}>
                  <i className="fas fa-external-link-alt"></i> Ouvrir dans un nouvel onglet
                </a>
              </div>
              <button 
                onClick={() => handleDelete(activeWidget.id, activeWidget.name)}
                disabled={isLoading}
                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                title="Supprimer cet outil"
              >
                <i className="fas fa-trash-alt"></i>
              </button>
            </div>
            <iframe 
              src={activeWidget.url} 
              style={{ width: '100%', flex: 1, border: 'none', minHeight: '600px' }}
              title={activeWidget.name}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
            />
          </>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            {widgets.length === 0 ? "Aucun outil configuré. Cliquez sur 'Ajouter un outil' pour commencer." : "Sélectionnez un outil pour l'afficher."}
          </div>
        )}
      </div>

    </div>
  );
}
