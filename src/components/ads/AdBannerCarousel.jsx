'use client';

import { useState, useEffect, useRef } from 'react';
import { ExternalLink, ChevronLeft, ChevronRight, Megaphone } from 'lucide-react';
import { getActiveBanners } from '@/lib/ads';

export default function AdBannerCarousel({ 
  placement = 'header', 
  initialBanners = null,
  style = {},
  className = '' 
}) {
  const [banners, setBanners] = useState(initialBanners || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(!initialBanners);
  const trackedImpressions = useRef(new Set());

  useEffect(() => {
    if (!initialBanners) {
      getActiveBanners(placement).then((res) => {
        setBanners(res);
        setLoading(false);
      });
    }
  }, [placement, initialBanners]);

  // Track Impression
  useEffect(() => {
    if (!banners.length) return;
    const current = banners[currentIndex];
    if (current && !trackedImpressions.current.has(current.id)) {
      trackedImpressions.current.add(current.id);
      fetch('/api/ads/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'impression', bannerId: current.id }),
      }).catch(() => {});
    }
  }, [currentIndex, banners]);

  // Auto-rotation
  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners.length, isPaused]);

  if (loading || !banners.length) {
    return null;
  }

  const current = banners[currentIndex];

  const handleBannerClick = () => {
    if (!current) return;
    fetch('/api/ads/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'click', bannerId: current.id }),
    }).catch(() => {});
  };

  const isSidebar = placement === 'sidebar';
  const isInFeed = placement === 'in_feed';
  const isVideo = current?.media_type === 'video' || (
    current?.image_url && /\.(mp4|webm|mov|ogg)($|\?)/i.test(current.image_url)
  );

  return (
    <div
      className={`ad-banner-container ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{
        position: 'relative',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        backgroundColor: '#0f172a',
        color: '#fff',
        margin: isSidebar ? '20px 0' : isInFeed ? '30px 0' : '20px 0',
        ...style,
      }}
    >
      <a
        href={current.link_url || '#'}
        target={current.link_url?.startsWith('http') ? '_blank' : '_self'}
        rel="noopener noreferrer"
        onClick={handleBannerClick}
        style={{
          display: 'flex',
          flexDirection: isSidebar ? 'column' : 'row',
          alignItems: 'stretch',
          textDecoration: 'none',
          color: 'inherit',
          minHeight: isSidebar ? 'auto' : '120px',
        }}
      >
        {/* Visuel Image ou Vidéo */}
        {current.image_url && (
          <div
            style={{
              width: isSidebar ? '100%' : '35%',
              minWidth: isSidebar ? '100%' : '260px',
              height: isSidebar ? '180px' : 'auto',
              minHeight: isSidebar ? '180px' : '130px',
              position: 'relative',
              backgroundColor: '#1e293b',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {isVideo ? (
              <video
                src={current.image_url}
                autoPlay
                loop
                muted
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            ) : (
              <img
                src={current.image_url}
                alt={current.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  transition: 'transform 0.4s ease',
                }}
                className="hover-zoom"
              />
            )}
            {/* Tag Sponsor / Badge sur l'image */}
            <div
              style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                backgroundColor: 'rgba(0,0,0,0.75)',
                backdropFilter: 'blur(4px)',
                color: '#ffce00',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Megaphone size={12} />
              {current.badge_text || 'Sponsorisé'}
            </div>
          </div>
        )}

        {/* Contenu Texte & CTA */}
        <div
          style={{
            flex: 1,
            padding: isSidebar ? '16px' : '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>
              {current.sponsor_name || 'Partenaire AFOLUKU TV'}
            </span>
          </div>

          <h3
            style={{
              margin: '0 0 6px 0',
              fontSize: isSidebar ? '16px' : '20px',
              fontWeight: '800',
              lineHeight: '1.3',
              color: '#ffffff',
              fontFamily: 'var(--font-heading, inherit)',
            }}
          >
            {current.title}
          </h3>

          {current.subtitle && (
            <p
              style={{
                margin: '0 0 12px 0',
                fontSize: isSidebar ? '13px' : '14px',
                color: '#cbd5e1',
                lineHeight: '1.4',
                display: '-webkit-box',
                WebkitLineClamp: isSidebar ? 2 : 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {current.subtitle}
            </p>
          )}

          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'var(--color-primary, #dc2626)',
                color: '#ffffff',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '700',
                transition: 'opacity 0.2s',
              }}
            >
              {current.cta_text || 'En savoir plus'}
              <ExternalLink size={14} />
            </span>

            {/* Navigation flèches si multiple */}
            {banners.length > 1 && (
              <div
                style={{ display: 'flex', gap: '4px' }}
                onClick={(e) => e.preventDefault()}
              >
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '4px',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                  title="Précédent"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => (prev + 1) % banners.length)}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '4px',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                  title="Suivant"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </a>

      {/* Barre d'indicateurs si multiple */}
      {banners.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: '4px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '6px',
            zIndex: 10,
          }}
        >
          {banners.map((_, idx) => (
            <span
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              style={{
                width: idx === currentIndex ? '16px' : '6px',
                height: '4px',
                borderRadius: '2px',
                backgroundColor: idx === currentIndex ? '#ffce00' : 'rgba(255,255,255,0.3)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
