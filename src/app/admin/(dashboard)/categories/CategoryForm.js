'use client';

import { useState } from 'react';
import { createCategory } from '../../actions';

export default function CategoryForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    const formData = new FormData(e.target);

    try {
      await createCategory(formData);
      e.target.reset();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="admin-form-container" style={{ marginBottom: '30px' }}>
      <h3 style={{ marginBottom: '15px' }}>Ajouter une catégorie</h3>
      
      {errorMsg && (
        <div style={{ padding: '10px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '4px', marginBottom: '15px' }}>
          {errorMsg}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px' }}>
        <input 
          type="text" 
          name="name" 
          className="admin-form-control" 
          required 
          placeholder="Nom de la catégorie (ex: Sport)"
        />
        <button type="submit" className="admin-btn admin-btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Ajout...' : 'Ajouter'}
        </button>
      </div>
    </form>
  );
}
