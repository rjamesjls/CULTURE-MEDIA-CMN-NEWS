'use client';

import { useState } from 'react';
import { deleteArticle } from '../../actions';

export default function DeleteButton({ id }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet article ? Cette action est irréversible.")) {
      setIsDeleting(true);
      try {
        await deleteArticle(id);
      } catch (error) {
        alert(error.message);
        setIsDeleting(false);
      }
    }
  };

  return (
    <button 
      onClick={handleDelete} 
      className="btn-icon btn-delete" 
      disabled={isDeleting}
      title="Supprimer"
    >
      <i className="fas fa-trash"></i>
    </button>
  );
}
