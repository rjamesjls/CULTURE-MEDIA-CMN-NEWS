'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { deleteCategory } from '../../actions';

export default function DeleteCategoryButton({ id }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirm('Voulez-vous vraiment supprimer cette catégorie ?')) {
      setIsDeleting(true);
      try {
        await deleteCategory(id);
      } catch (err) {
        alert(err.message);
        setIsDeleting(false);
      }
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={isDeleting}
      className="admin-btn-icon admin-btn-danger"
      title="Supprimer"
    >
      <Trash2 size={16} />
    </button>
  );
}
