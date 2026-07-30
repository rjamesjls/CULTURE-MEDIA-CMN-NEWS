'use client';

import { useTransition } from 'react';
import { deletePage } from './actions';

export default function DeleteButton({ id }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirm('Voulez-vous vraiment supprimer cette page ?')) {
      startTransition(async () => {
        try {
          await deletePage(id);
        } catch (error) {
          alert(error.message);
        }
      });
    }
  };

  return (
    <button 
      onClick={handleDelete} 
      className="admin-action-btn" 
      title="Supprimer"
      disabled={isPending}
      style={{ opacity: isPending ? 0.5 : 1, cursor: isPending ? 'not-allowed' : 'pointer' }}
    >
      <i className="fas fa-trash" style={{ color: '#ef4444' }}></i>
    </button>
  );
}
