'use client';

import { useState } from 'react';
import { saveMenu } from './actions';

export default function MenuForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    const formData = new FormData(e.target);

    try {
      await saveMenu(formData);
      e.target.reset();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-card" style={{ marginBottom: '30px' }}>
      <h3 style={{ marginTop: 0, fontFamily: 'var(--font-heading)' }}>Ajouter un Menu</h3>
      <form onSubmit={handleSubmit} className="admin-form-container" style={{ margin: 0, display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        {errorMsg && (
          <div style={{ padding: '10px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '4px', width: '100%' }}>
            {errorMsg}
          </div>
        )}
        
        <div className="admin-form-group" style={{ flex: '1 1 200px' }}>
          <label className="admin-form-label">Titre du lien</label>
          <input type="text" name="label" className="admin-form-control" required placeholder="Ex: Culture" />
        </div>

        <div className="admin-form-group" style={{ flex: '1 1 200px' }}>
          <label className="admin-form-label">URL / Lien</label>
          <input type="text" name="url" className="admin-form-control" required placeholder="Ex: /category?cat=culture" />
        </div>

        <div className="admin-form-group" style={{ flex: '1 1 100px' }}>
          <label className="admin-form-label">Position</label>
          <input type="number" name="position" className="admin-form-control" defaultValue="0" required />
        </div>

        <div className="admin-form-group" style={{ flex: '1 1 150px' }}>
          <label className="admin-form-label">Emplacement</label>
          <select name="location" className="admin-form-control" required>
            <option value="header">En-tête (Header)</option>
            <option value="footer">Pied de page (Footer)</option>
          </select>
        </div>

        <div className="admin-form-group">
          <button type="submit" className="admin-btn admin-btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Ajout...' : 'Ajouter'}
          </button>
        </div>
      </form>
    </div>
  );
}
