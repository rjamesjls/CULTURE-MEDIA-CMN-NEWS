import { createClient } from '@/utils/supabase/server';
import TickerClock from './TickerClock';

export default async function FlashTicker() {
  const supabase = await createClient();
  const { data: latestArticles, error } = await supabase
    .from('articles')
    .select('title')
    .eq('status', 'published')
    .order('pub_date', { ascending: false })
    .limit(5);

  if (error || !latestArticles || latestArticles.length === 0) {
    return null; // Ne rien afficher s'il n'y a pas d'article
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
          {latestArticles.map((article, idx) => (
            <span key={idx} className="flash-ticker-item">
              <span className="flash-bullet">•</span> {article.title}
            </span>
          ))}
          
          {/* Duplicate for seamless looping effect if there are few items */}
          {latestArticles.map((article, idx) => (
            <span key={`dup-${idx}`} className="flash-ticker-item">
              <span className="flash-bullet">•</span> {article.title}
            </span>
          ))}
        </div>
      </div>
      <TickerClock />
    </div>
  );
}
