'use client';

import { useState, useEffect } from 'react';

export default function TickerClock() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // On affiche l'heure au format HH:MM (ex: 14:30)
      setTime(now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Pour éviter le décalage (hydration mismatch) lors du rendu serveur,
  // on affiche un espace vide en attendant que le client reprenne la main
  if (!time) {
    return (
      <div className="flash-ticker-clock">
        --:--
      </div>
    );
  }

  return (
    <div className="flash-ticker-clock">
      <i className="far fa-clock" style={{ marginRight: '8px' }}></i> {time}
    </div>
  );
}
