'use client';

import useTTS from '@/hooks/useTTS';

export default function TextToSpeechButton({ title, content, style }) {
  const { isSpeaking, isPaused, isSupported, play, pause, stop } = useTTS();

  if (!isSupported) {
    return null;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', ...style }}>
      {(!isSpeaking && !isPaused) && (
        <button 
          onClick={() => play(title, content)}
          style={buttonStyle}
          title="Écouter l'article"
        >
          <i className="fas fa-play" style={{ color: 'var(--color-primary)' }}></i>
          <span>Écouter</span>
        </button>
      )}

      {isSpeaking && (
        <button 
          onClick={pause}
          style={buttonStyle}
          title="Mettre en pause"
        >
          <i className="fas fa-pause" style={{ color: '#eab308' }}></i>
          <span>Pause</span>
        </button>
      )}

      {isPaused && (
        <button 
          onClick={() => play(title, content)}
          style={buttonStyle}
          title="Reprendre la lecture"
        >
          <i className="fas fa-play" style={{ color: 'var(--color-primary)' }}></i>
          <span>Reprendre</span>
        </button>
      )}

      {(isSpeaking || isPaused) && (
        <button 
          onClick={stop}
          style={{ ...buttonStyle, padding: '8px 12px' }}
          title="Arrêter la lecture"
        >
          <i className="fas fa-stop" style={{ color: '#ef4444' }}></i>
        </button>
      )}
    </div>
  );
}

const buttonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  backgroundColor: '#f3f4f6',
  border: '1px solid #e5e7eb',
  borderRadius: '20px',
  padding: '8px 16px',
  fontSize: '14px',
  fontWeight: '500',
  color: '#374151',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
};
