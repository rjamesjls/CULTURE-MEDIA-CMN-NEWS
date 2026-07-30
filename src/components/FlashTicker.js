import { getActiveFlashInfos } from '@/app/admin/(dashboard)/flash-infos/actions';
import TickerClock from './TickerClock';

export default async function FlashTicker() {
  const activeFlashes = await getActiveFlashInfos();

  if (!activeFlashes || activeFlashes.length === 0) {
    return null; // Ne rien afficher s'il n'y a pas de flash info actif
  }

  return (
    <div className="flash-ticker-container">
      <div className="flash-ticker-label">
        <div className="live-indicator">
          <div className="live-indicator-circle"></div>
          <div className="live-indicator-pulse"></div>
        </div>
        BREAKING NEWS
      </div>
      <div className="flash-ticker-content">
        <div className="flash-ticker-track">
          {activeFlashes.map((flash) => (
            <span key={flash.id} className="flash-ticker-item">
              <span className="flash-bullet">•</span> {flash.content}
            </span>
          ))}
          
          {/* Duplicate for seamless looping effect if there are few items */}
          {activeFlashes.map((flash) => (
            <span key={`dup-${flash.id}`} className="flash-ticker-item">
              <span className="flash-bullet">•</span> {flash.content}
            </span>
          ))}
        </div>
      </div>
      <TickerClock />
    </div>
  );
}
