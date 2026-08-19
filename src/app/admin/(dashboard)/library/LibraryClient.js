'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function LibraryClient() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchMedia = async (type = 'all') => {
    setLoading(true);
    try {
      const response = await fetch(`/api/library/list?type=${type}`);
      const data = await response.json();
      if (data.items) {
        setMedia(data.items);
      }
    } catch (error) {
      console.error('Erreur chargement media:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia(filter);
  }, [filter]);

  const tabs = [
    { id: 'all', label: 'Tout' },
    { id: 'image', label: 'Images' },
    { id: 'video', label: 'Vidéos' },
    { id: 'audio', label: 'Audios' },
    { id: 'generation', label: 'Téléchargements (Générateur)' },
  ];

  return (
    <div className="admin-content" style={{ padding: '30px' }}>
      <div className="admin-header" style={{ marginBottom: '30px' }}>
        <h1 className="admin-page-title" style={{ fontSize: '32px', fontWeight: 'bold' }}>Médiathèque</h1>
        <p className="admin-page-subtitle" style={{ color: '#6b7280' }}>
          Retrouvez tous vos fichiers téléchargés et générés, sans aucun doublon.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', overflowX: 'auto', paddingBottom: '10px' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            style={{
              padding: '10px 20px',
              borderRadius: '30px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              backgroundColor: filter === tab.id ? '#111' : '#f3f4f6',
              color: filter === tab.id ? '#fff' : '#4b5563',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#6b7280' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '30px', marginBottom: '10px' }}></i>
          <p>Chargement de la bibliothèque...</p>
        </div>
      ) : media.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', backgroundColor: '#f9fafb', borderRadius: '15px', color: '#6b7280' }}>
          <i className="fas fa-folder-open" style={{ fontSize: '40px', marginBottom: '15px', color: '#9ca3af' }}></i>
          <p style={{ fontSize: '18px' }}>Aucun média trouvé dans cette catégorie.</p>
          <p style={{ fontSize: '14px' }}>Vos prochaines images générées et fichiers importés apparaîtront ici.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
          {media.map((item) => (
            <div key={item.id} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#f3f4f6', aspectRatio: '4/5', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              {item.file_type === 'video' ? (
                <video src={item.file_url} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : item.file_type === 'audio' ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '20px' }}>
                  <audio src={item.file_url} controls style={{ width: '100%' }} />
                </div>
              ) : (
                <img src={item.file_url} alt={item.file_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
              
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', color: '#fff', fontSize: '12px' }}>
                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 'bold' }}>
                  {item.file_name}
                </div>
                <div style={{ opacity: 0.8, marginTop: '2px' }}>
                  {new Date(item.created_at).toLocaleDateString('fr-FR')}
                </div>
                <a href={item.file_url} download target="_blank" rel="noopener noreferrer" style={{ position: 'absolute', right: '10px', top: '10px', color: '#fff' }}>
                  <i className="fas fa-download"></i>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
