'use client';

import { deleteMenu } from './actions';
import { useState } from 'react';

export default function DeleteMenuButton({ id }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirm('Voulez-vous vraiment supprimer ce lien ?')) {
      setIsDeleting(true);
      try {
        await deleteMenu(id);
      } catch (err) {
        alert(err.message);
        setIsDeleting(false);
      }
    }
  };

  return (
    <button 
      onClick={handleDelete} 
      className="admin-btn admin-btn-danger" 
      style={{ padding: '5px 10px', fontSize: '0.9em' }}
      disabled={isDeleting}
    >
      {isDeleting ? '...' : <i className="fas fa-trash"></i>}
    </button>
  );
}
