'use client';

import { useState } from 'react';
import { toggleArticleStatus } from '../../actions';

import { useRouter } from 'next/navigation';

export default function ToggleStatusButton({ id, currentStatus }) {
  const [isToggling, setIsToggling] = useState(false);
  const router = useRouter();

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await toggleArticleStatus(id, currentStatus);
      router.refresh();
    } catch (error) {
      alert(error.message);
    } finally {
      setIsToggling(false);
    }
  };

  const isPublished = currentStatus === 'published';

  return (
    <button 
      onClick={handleToggle} 
      className="btn-icon" 
      disabled={isToggling}
      title={isPublished ? "Repasser en brouillon" : "Publier"}
      style={{
        padding: '6px',
        backgroundColor: isPublished ? '#fef3c7' : '#dcfce7',
        color: isPublished ? '#d97706' : '#16a34a',
        opacity: isToggling ? 0.5 : 1,
      }}
    >
      <i className={isPublished ? "fas fa-eye-slash" : "fas fa-eye"}></i>
    </button>
  );
}
