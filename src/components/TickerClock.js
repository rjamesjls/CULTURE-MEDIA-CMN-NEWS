'use client';

import { useState, useEffect } from 'react';

export default function TickerClock() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateOpts = { day: 'numeric', month: 'short', year: 'numeric' };
      const timeOpts = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
      
      const dateStr = now.toLocaleDateString('fr-FR', dateOpts);
      const timeStr = now.toLocaleTimeString('fr-FR', timeOpts);
      
      setTime(`${dateStr} - ${timeStr}`);
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
