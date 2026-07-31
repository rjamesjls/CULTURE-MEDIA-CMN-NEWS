'use client';

import { useState } from 'react';
import Link from 'next/link';
import { deleteMagazine } from '../../actions/magazines';
import { useRouter } from 'next/navigation';

export default function MagazineList({ initialMagazines }) {
  const [magazines, setMagazines] = useState(initialMagazines);
  const router = useRouter();

  const handleDelete = async (id) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce magazine ?')) {
      try {
        await deleteMagazine(id);
        setMagazines(magazines.filter(m => m.id !== id));
        router.refresh();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  if (magazines.length === 0) {
    return (
      <div className="admin-card" style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
        <i className="fas fa-book-open" style={{ fontSize: '48px', marginBottom: '16px', color: '#d1d5db' }}></i>
        <p>Aucun magazine n'a été créé pour le moment.</p>
        <Link href="/admin/magazines/new" className="admin-btn admin-btn-primary" style={{ marginTop: '16px' }}>
          Créer mon premier numéro
        </Link>
      </div>
    );
  }

  return (
    <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
      {magazines.map((mag) => (
        <div key={mag.id} className="admin-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ 
            height: '200px', 
            background: mag.cover_image_url 
              ? `url(${mag.cover_image_url}) center/cover` 
              : 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
            position: 'relative'
          }}>
            <span style={{ 
              position: 'absolute', 
              top: '10px', right: '10px', 
              backgroundColor: mag.type === 'static' ? '#3b82f6' : '#8b5cf6', 
              color: 'white', 
              padding: '4px 8px', 
              borderRadius: '4px', 
              fontSize: '12px',
              fontWeight: 'bold' 
            }}>
              {mag.type === 'static' ? 'Images / PDF' : 'Articles Dynamiques'}
            </span>
          </div>
          <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>{mag.title}</h3>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 15px 0', flex: 1 }}>{mag.description}</p>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e5e7eb', paddingTop: '15px' }}>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                {new Date(mag.publication_date).toLocaleDateString('fr-FR')}
              </span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Link 
                  href={`/magazine/${mag.id}`} 
                  target="_blank" 
                  className="btn-icon" 
                  style={{ backgroundColor: '#10b981', color: 'white' }} 
                  title="Voir le magazine"
                >
                  <i className="fas fa-external-link-alt"></i>
                </Link>
                <Link 
                  href={`/admin/magazines/edit/${mag.id}`} 
                  className="btn-icon btn-edit" 
                  title="Modifier le magazine"
                >
                  <i className="fas fa-edit"></i>
                </Link>
                <button 
                  onClick={() => handleDelete(mag.id)} 
                  className="btn-icon btn-delete" 
                  title="Supprimer"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
