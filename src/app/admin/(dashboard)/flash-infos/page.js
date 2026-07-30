'use client';

import { useState, useEffect } from 'react';
import { getFlashInfos, addFlashInfo, toggleFlashInfoActive, deleteFlashInfo, updateFlashInfo } from './actions';
import { useRouter } from 'next/navigation';

export default function FlashInfosPage() {
  const router = useRouter();
  const [flashes, setFlashes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newFlash, setNewFlash] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Pour l'édition en ligne
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    fetchFlashes();
  }, []);

  const fetchFlashes = async () => {
    setIsLoading(true);
    const res = await getFlashInfos();
    if (res.success) {
      setFlashes(res.data);
    } else {
      console.error(res.error);
    }
    setIsLoading(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newFlash.trim()) return;
    
    setIsSubmitting(true);
    setErrorMsg('');
    
    const res = await addFlashInfo(newFlash);
    if (res.success) {
      setNewFlash('');
      fetchFlashes(); // refresh list
    } else {
      setErrorMsg(res.error);
    }
    setIsSubmitting(false);
  };

  const handleToggle = async (id, currentStatus) => {
    const res = await toggleFlashInfoActive(id, currentStatus);
    if (res.success) {
      fetchFlashes();
    } else {
      alert("Erreur: " + res.error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Voulez-vous vraiment supprimer cette info ?")) return;
    const res = await deleteFlashInfo(id);
    if (res.success) {
      fetchFlashes();
    } else {
      alert("Erreur: " + res.error);
    }
  };

  const handleGenerateArticle = (content) => {
    // Redirige vers le générateur IA en passant le contenu du flash en paramètre d'URL
    router.push(`/admin/ai-generator?subject=${encodeURIComponent(content)}`);
  };

  const startEditing = (flash) => {
    setEditingId(flash.id);
    setEditContent(flash.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditContent('');
  };

  const saveEdit = async (id) => {
    if (!editContent.trim()) {
      alert("Le contenu ne peut pas être vide.");
      return;
    }
    setIsSavingEdit(true);
    const res = await updateFlashInfo(id, editContent);
    if (res.success) {
      setEditingId(null);
      setEditContent('');
      fetchFlashes();
    } else {
      alert("Erreur lors de la modification : " + res.error);
    }
    setIsSavingEdit(false);
  };

  return (
    <div className="admin-content-card">
      <div className="admin-header-actions">
        <h1 className="admin-page-title">⚡ Gestion des Flash Infos</h1>
      </div>

      <p style={{ color: '#6b7280', marginBottom: '30px' }}>
        Les "Flash Infos" s'affichent dans le bandeau défilant au-dessus du menu principal du site.
        Ajoutez-en pour avertir d'une actualité chaude (Breaking News).
      </p>

      {errorMsg && (
        <div style={{ padding: '15px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '6px', marginBottom: '20px' }}>
          {errorMsg}
        </div>
      )}

      {/* Formulaire d'ajout */}
      <form onSubmit={handleAdd} style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '30px' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>Diffuser une nouvelle Flash Info</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            className="admin-form-control" 
            style={{ flex: 1, margin: 0 }}
            placeholder="Ex: Alerte Météo : Vigilance rouge sur 5 départements du Sud-Est à partir de 18h..."
            value={newFlash}
            onChange={e => setNewFlash(e.target.value)}
            required
          />
          <button 
            type="submit" 
            className="admin-btn admin-btn-primary"
            disabled={isSubmitting}
            style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
          >
            {isSubmitting ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-bolt"></i> Diffuser</>}
          </button>
        </div>
      </form>

      {/* Liste des Flash Infos */}
      <div className="admin-table-container">
        {isLoading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
            <i className="fas fa-spinner fa-spin"></i> Chargement des flash infos...
          </div>
        ) : flashes.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#6b7280' }}>
            Aucune flash info n'a été créée pour le moment.
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '10%' }}>Statut</th>
                <th style={{ width: '45%' }}>Contenu du Flash Info</th>
                <th style={{ width: '15%' }}>Date</th>
                <th style={{ width: '30%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {flashes.map((flash) => (
                <tr key={flash.id}>
                  <td>
                    {flash.is_active ? (
                      <span className="status-badge status-published">Actif</span>
                    ) : (
                      <span className="status-badge status-draft">Inactif</span>
                    )}
                  </td>
                  <td>
                    {editingId === flash.id ? (
                      <textarea
                        className="admin-form-control"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        style={{ width: '100%', minHeight: '60px', margin: 0, resize: 'vertical' }}
                      />
                    ) : (
                      <strong>{flash.content}</strong>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      {new Date(flash.created_at).toLocaleString('fr-FR')}
                    </span>
                  </td>
                  <td>
                    {editingId === flash.id ? (
                      <div className="admin-table-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button 
                          className="admin-btn admin-btn-primary"
                          style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: '#10b981', borderColor: '#10b981' }}
                          onClick={() => saveEdit(flash.id)}
                          disabled={isSavingEdit}
                        >
                          {isSavingEdit ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check"></i>} Sauvegarder
                        </button>
                        <button 
                          className="admin-btn"
                          style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: '#f3f4f6' }}
                          onClick={cancelEditing}
                        >
                          <i className="fas fa-times"></i> Annuler
                        </button>
                      </div>
                    ) : (
                      <div className="admin-table-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button 
                          className={`admin-btn ${flash.is_active ? '' : 'admin-btn-primary'}`}
                          style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: flash.is_active ? '#f3f4f6' : '#10b981', color: flash.is_active ? '#374151' : 'white' }}
                          onClick={() => handleToggle(flash.id, flash.is_active)}
                          title={flash.is_active ? "Désactiver (Retirer du bandeau)" : "Activer (Afficher dans le bandeau)"}
                        >
                          {flash.is_active ? <i className="fas fa-eye-slash"></i> : <i className="fas fa-eye"></i>}
                        </button>
                        <button 
                          className="admin-btn"
                          style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}
                          onClick={() => startEditing(flash)}
                          title="Modifier le texte"
                        >
                          <i className="fas fa-edit"></i> Modifier
                        </button>
                        <button 
                          className="admin-btn"
                          style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }}
                          onClick={() => handleGenerateArticle(flash.content)}
                          title="Créer un article complet via l'IA"
                        >
                          <i className="fas fa-magic"></i> Générer Article
                        </button>
                        <button 
                          className="admin-btn-icon" 
                          style={{ color: '#ef4444' }}
                          onClick={() => handleDelete(flash.id)}
                          title="Supprimer"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
