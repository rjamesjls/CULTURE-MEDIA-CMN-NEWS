'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowUpRight, Megaphone } from 'lucide-react';
import { getActiveBanners } from '@/lib/ads';

export function extractMediaPosition(url) {
  if (!url) return 'center';
  const match = url.match(/#pos=([^&]+)/);
  if (match && match[1]) {
    return decodeURIComponent(match[1]).replace(/_/g, ' ');
  }
  return 'center';
}

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
    if (current?.id && !trackedImpressions.current.has(current.id)) {
      trackedImpressions.current.add(current.id);
      fetch('/api/ads/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'impression', bannerId: current.id }),
        keepalive: true,
      }).catch(() => {});
    }
  }, [currentIndex, banners]);

  // Auto-rotation (6 seconds like BoLivro)
  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners.length, isPaused]);

  if (loading || !banners || banners.length === 0) {
    return null;
  }

  const current = banners[currentIndex];
  const isVideo = current?.media_type === 'video' || (
    current?.image_url && /\.(mp4|webm|mov|ogg)($|\?)/i.test(current.image_url)
  );

  const mediaPosition = current?.object_position || extractMediaPosition(current?.image_url) || 'center';

  const isMediaOnly = Boolean(current?.is_media_only);
  const hasTitle = !isMediaOnly && Boolean(current?.title?.trim());
  const hasSubtitle = !isMediaOnly && Boolean(current?.subtitle?.trim());
  const hasSponsor = !isMediaOnly && Boolean(current?.sponsor_name?.trim());
  const hasBadge = !isMediaOnly && Boolean(current?.badge_text?.trim());
  const hasCta = !isMediaOnly && Boolean(current?.cta_text?.trim());
  const hasAnyText = !isMediaOnly && (hasTitle || hasSubtitle || hasSponsor || hasBadge || hasCta);

  const handleBannerClick = () => {
    if (!current?.id) return;
    try {
      fetch('/api/ads/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'click', bannerId: current.id }),
        keepalive: true,
      }).catch(() => {});
    } catch (_) {}
  };

  const isSidebar = placement === 'sidebar';
  const isInFeed = placement === 'in_feed';
  const bannerHeight = isSidebar ? '280px' : isInFeed ? '220px' : '260px';

  return (
    <div
      className={`ad-banner-bolivro ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{
        position: 'relative',
        width: '100%',
        height: bannerHeight,
        borderRadius: isSidebar ? '14px' : '20px',
        overflow: 'hidden',
        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
        backgroundColor: '#090d16',
        color: '#fff',
        margin: isSidebar ? '20px 0' : isInFeed ? '28px 0' : '20px 0',
        cursor: 'pointer',
        ...style,
      }}
    >
      <a
        href={current.link_url || '#'}
        target={current.link_url?.startsWith('http') ? '_blank' : '_self'}
        rel="noopener noreferrer"
        onClick={handleBannerClick}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          textDecoration: 'none',
          color: 'inherit',
          position: 'relative',
        }}
      >
        {/* Visuel immersif plein cadre (Image ou Vidéo avec repositionnement) */}
        {current.image_url ? (
          isVideo ? (
            <video
              src={current.image_url}
              autoPlay
              loop
              muted
              playsInline
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: mediaPosition,
                display: 'block',
              }}
            />
          ) : (
            <img
              src={current.image_url}
              alt={current.title || 'Bannière publicitaire'}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: mediaPosition,
                display: 'block',
                transition: 'transform 0.8s ease',
              }}
              className="hover-zoom"
            />
          )
        ) : (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            }}
          />
        )}

        {/* Dégradé sombre : UNIQUEMENT s'il y a du texte à afficher */}
        {hasAnyText && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.15) 100%)',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Badge Annonceur / Sponsor : UNIQUEMENT si renseigné */}
        {(hasBadge || hasSponsor) && (
          <div
            style={{
              position: 'absolute',
              top: '14px',
              left: '16px',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {hasBadge && (
              <span
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.65)',
                  backdropFilter: 'blur(8px)',
                  color: '#ffce00',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
              >
                <Megaphone size={12} />
                {current.badge_text}
              </span>
            )}
            {hasSponsor && (
              <span
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(8px)',
                  color: '#f8fafc',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '600',
                  letterSpacing: '0.3px',
                }}
              >
                {current.sponsor_name}
              </span>
            )}
          </div>
        )}

        {/* Contenu textuel et bouton CTA BoLivro : UNIQUEMENT si renseigné */}
        {hasAnyText && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: isSidebar ? '16px' : '20px 28px',
              zIndex: 10,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
              {hasTitle && (
                <h3
                  style={{
                    margin: '0 0 6px 0',
                    fontSize: isSidebar ? '16px' : '22px',
                    fontWeight: '900',
                    lineHeight: '1.25',
                    color: '#ffffff',
                    textShadow: '0 2px 10px rgba(0,0,0,0.8)',
                    fontFamily: 'var(--font-heading, inherit)',
                    display: '-webkit-box',
                    WebkitLineClamp: isSidebar ? 2 : 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {current.title}
                </h3>
              )}

              {hasSubtitle && (
                <p
                  style={{
                    margin: 0,
                    fontSize: isSidebar ? '12px' : '14px',
                    color: 'rgba(255, 255, 255, 0.85)',
                    lineHeight: '1.35',
                    textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                    display: '-webkit-box',
                    WebkitLineClamp: isSidebar ? 2 : 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    maxWidth: '700px',
                  }}
                >
                  {current.subtitle}
                </p>
              )}
            </div>

            {hasCta && (
              <div style={{ flexShrink: 0 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.22)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.35)',
                    color: '#ffffff',
                    padding: isSidebar ? '6px 12px' : '8px 16px',
                    borderRadius: '9999px',
                    fontSize: isSidebar ? '12px' : '13px',
                    fontWeight: '700',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span>{current.cta_text}</span>
                  <ArrowUpRight size={15} />
                </span>
              </div>
            )}
          </div>
        )}
      </a>

      {/* Pagination : petits tirets discrets en bas */}
      {banners.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            zIndex: 20,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {banners.map((_, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Bannière ${idx + 1}`}
                style={{
                  width: isActive ? '24px' : '6px',
                  height: '5px',
                  borderRadius: '3px',
                  backgroundColor: isActive ? '#ffce00' : 'rgba(255, 255, 255, 0.4)',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.3s ease',
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
