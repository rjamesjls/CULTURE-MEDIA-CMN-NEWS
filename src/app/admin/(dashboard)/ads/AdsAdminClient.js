'use client';

import { useState, useRef, useMemo } from 'react';
import {
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  Eye,
  MousePointerClick,
  CheckCircle2,
  XCircle,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Calendar,
  Save,
  X,
  Upload,
  Percent,
  Sliders,
  Film,
  Image as ImageIcon,
  FileText,
  Search,
  Sparkles,
  Play,
  Move,
  EyeOff
} from 'lucide-react';
import { saveBannerData, deleteBannerData } from '@/lib/ads';
import { supabase } from '@/lib/supabase';

const BADGE_PRESETS = [
  'Sponsorisé',
  'À la une',
  'Article Partenaire',
  'Offre Partenaire',
  'Événement',
  'Nouveau',
  'Promo Exclusive',
];

const PLACEMENTS = [
  { id: 'header', label: 'Haut de page (Header)' },
  { id: 'in_feed', label: 'Entre les articles (In-feed)' },
  { id: 'sidebar', label: 'Barre latérale (Sidebar)' },
  { id: 'all', label: 'Tous les emplacements' },
];

export function extractCoords(url, objectPosition) {
  if (objectPosition) {
    const parts = objectPosition.split(' ');
    const x = parseInt(parts[0], 10);
    const y = parseInt(parts[1], 10);
    return { x: isNaN(x) ? 50 : x, y: isNaN(y) ? 50 : y };
  }
  if (!url) return { x: 50, y: 50 };
  const match = url.match(/#pos=([^&]+)/);
  if (match && match[1]) {
    const raw = decodeURIComponent(match[1]).replace(/_/g, ' ');
    const parts = raw.split(' ');
    const x = parseInt(parts[0], 10);
    const y = parseInt(parts[1], 10);
    return { x: isNaN(x) ? 50 : x, y: isNaN(y) ? 50 : y };
  }
  return { x: 50, y: 50 };
}

export function applyMediaPosition(url, position) {
  if (!url) return '';
  const cleanUrl = url.replace(/#pos=[^&]+/, '').replace(/#$/, '');
  if (!position || position === 'center' || position === '50% 50%') return cleanUrl;
  const encoded = encodeURIComponent(position.replace(/\s+/g, '_'));
  return `${cleanUrl}#pos=${encoded}`;
}

export default function AdsAdminClient({ initialBanners = [], articles = [] }) {
  const [banners, setBanners] = useState(initialBanners);
  const [filterPlacement, setFilterPlacement] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Article Picker State
  const [showArticlePicker, setShowArticlePicker] = useState(false);
  const [articleSearchQuery, setArticleSearchQuery] = useState('');

  // Form State
  const [isMediaOnly, setIsMediaOnly] = useState(false);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [sponsorName, setSponsorName] = useState('');
  const [badgeText, setBadgeText] = useState('Sponsorisé');
  const [imageUrl, setImageUrl] = useState('');
  const [positionX, setPositionX] = useState(50);
  const [positionY, setPositionY] = useState(50);
  const [mediaType, setMediaType] = useState('image'); // 'image' | 'video'
  const [linkUrl, setLinkUrl] = useState('');
  const [ctaText, setCtaText] = useState('En savoir plus');
  const [placement, setPlacement] = useState('header');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);

  const fileInputRef = useRef(null);

  // Helper check if URL is video
  const checkIsVideo = (url, type) => {
    if (type === 'video') return true;
    if (!url) return false;
    return /\.(mp4|webm|mov|ogg)($|\?)/i.test(url);
  };

  // Stats calculation
  const totalViews = banners.reduce((sum, b) => sum + (b.views_count || 0), 0);
  const totalClicks = banners.reduce((sum, b) => sum + (b.clicks_count || 0), 0);
  const activeCount = banners.filter((b) => b.is_active).length;
  const averageCtr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : 0;

  const openNewModal = () => {
    setEditingBanner(null);
    setIsMediaOnly(false);
    setTitle('');
    setSubtitle('');
    setSponsorName('');
    setBadgeText('Sponsorisé');
    setImageUrl('');
    setPositionX(50);
    setPositionY(50);
    setMediaType('image');
    setLinkUrl('');
    setCtaText('En savoir plus');
    setPlacement('header');
    setStartDate('');
    setEndDate('');
    setIsActive(true);
    setShowArticlePicker(false);
    setShowModal(true);
  };

  const openEditModal = (banner) => {
    setEditingBanner(banner);
    const coords = extractCoords(banner.image_url, banner.object_position);
    setPositionX(coords.x);
    setPositionY(coords.y);

    const hasAnyText = Boolean(banner.title || banner.subtitle || banner.sponsor_name || banner.badge_text || banner.cta_text);
    setIsMediaOnly(Boolean(banner.is_media_only) || (!hasAnyText && Boolean(banner.image_url)));

    setTitle(banner.title || '');
    setSubtitle(banner.subtitle || '');
    setSponsorName(banner.sponsor_name || '');
    setBadgeText(banner.badge_text || '');
    setImageUrl(banner.image_url ? banner.image_url.replace(/#pos=[^&]+/, '').replace(/#$/, '') : '');
    setMediaType(banner.media_type || (checkIsVideo(banner.image_url) ? 'video' : 'image'));
    setLinkUrl(banner.link_url || '');
    setCtaText(banner.cta_text || '');
    setPlacement(banner.placement || 'header');
    setStartDate(banner.start_date ? banner.start_date.substring(0, 10) : '');
    setEndDate(banner.end_date ? banner.end_date.substring(0, 10) : '');
    setIsActive(banner.is_active ?? true);
    setShowArticlePicker(false);
    setShowModal(true);
  };

  const handleMediaUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const maxSize = isVideo ? 60 * 1024 * 1024 : 15 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`Fichier trop volumineux. Limite : ${isVideo ? '60 Mo pour une vidéo' : '15 Mo pour une photo'}.`);
      return;
    }

    setUploadingMedia(true);
    try {
      const fileExt = file.name.split('.').pop();
      const folder = isVideo ? 'ads/videos' : 'ads/images';
      const fileName = `${folder}/banner_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('media').getPublicUrl(fileName);
      setImageUrl(data.publicUrl);
      setMediaType(isVideo ? 'video' : 'image');
    } catch (err) {
      alert("Erreur lors de l'upload : " + err.message);
    } finally {
      setUploadingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSelectArticle = (art) => {
    setTitle(art.title || '');
    setSubtitle(art.description || art.hook_bsh || '');
    if (art.image_url) {
      setImageUrl(art.image_url);
      setMediaType('image');
    }
    setLinkUrl(`/fr/article/${art.slug}`);
    setSponsorName(art.author ? `Par ${art.author}` : 'Rédaction AFOLUKU TV');
    setBadgeText('À la une');
    setCtaText('Lire l’article');
    setIsMediaOnly(false);
    setShowArticlePicker(false);
  };

  const filteredArticles = useMemo(() => {
    if (!articleSearchQuery.trim()) return articles.slice(0, 15);
    const q = articleSearchQuery.toLowerCase();
    return articles.filter(
      (a) =>
        a.title?.toLowerCase().includes(q) ||
        a.category?.toLowerCase().includes(q) ||
        a.author?.toLowerCase().includes(q)
    ).slice(0, 15);
  }, [articles, articleSearchQuery]);

  const clearAllTexts = () => {
    setTitle('');
    setSubtitle('');
    setSponsorName('');
    setBadgeText('');
    setCtaText('');
    setIsMediaOnly(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const finalTitle = title.trim() || (isMediaOnly ? 'Bannière visuelle' : '');

    if (!isMediaOnly && !finalTitle) {
      alert('Veuillez renseigner un titre pour la bannière ou cocher "Bannière 100% visuelle".');
      return;
    }

    if (isMediaOnly && !imageUrl.trim()) {
      alert('Veuillez fournir une image ou une vidéo pour une bannière 100% visuelle.');
      return;
    }

    setSaving(true);
    try {
      const finalImageUrl = applyMediaPosition(imageUrl.trim(), `${positionX}% ${positionY}%`);
      const payload = {
        id: editingBanner?.id,
        title: finalTitle,
        subtitle: isMediaOnly ? '' : subtitle.trim(),
        sponsor_name: isMediaOnly ? '' : sponsorName.trim(),
        badge_text: isMediaOnly ? '' : badgeText.trim(),
        image_url: finalImageUrl,
        object_position: `${positionX}% ${positionY}%`,
        media_type: mediaType,
        link_url: linkUrl.trim(),
        cta_text: isMediaOnly ? '' : ctaText.trim(),
        is_media_only: isMediaOnly,
        placement,
        start_date: startDate ? new Date(startDate).toISOString() : null,
        end_date: endDate ? new Date(endDate).toISOString() : null,
        is_active: isActive,
        display_order: editingBanner?.display_order ?? banners.length,
        views_count: editingBanner?.views_count || 0,
        clicks_count: editingBanner?.clicks_count || 0,
      };

      const res = await saveBannerData(payload);
      if (res.success) {
        if (editingBanner) {
          setBanners((prev) => prev.map((b) => (b.id === res.banner.id ? res.banner : b)));
        } else {
          setBanners((prev) => [res.banner, ...prev]);
        }
        setShowModal(false);
      }
    } catch (err) {
      alert("Erreur lors de l'enregistrement : " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet encart publicitaire ?')) return;
    try {
      await deleteBannerData(id);
      setBanners((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      alert('Erreur lors de la suppression : ' + err.message);
    }
  };

  const handleToggle = async (banner) => {
    const updated = { ...banner, is_active: !banner.is_active };
    try {
      await saveBannerData(updated);
      setBanners((prev) => prev.map((b) => (b.id === banner.id ? updated : b)));
    } catch (err) {
      alert('Erreur de mise à jour du statut : ' + err.message);
    }
  };

  const handleMove = async (index, direction) => {
    const newBanners = [...banners];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newBanners.length) return;

    const temp = newBanners[index];
    newBanners[index] = newBanners[targetIndex];
    newBanners[targetIndex] = temp;

    newBanners.forEach((b, idx) => {
      b.display_order = idx;
    });

    setBanners(newBanners);

    try {
      await Promise.all([
        saveBannerData(newBanners[index]),
        saveBannerData(newBanners[targetIndex]),
      ]);
    } catch (err) {
      console.error('Erreur réordonnancement:', err);
    }
  };

  const filteredBanners = banners.filter((b) => {
    if (filterPlacement === 'all') return true;
    return b.placement === filterPlacement || b.placement === 'all';
  });

  return (
    <div className="admin-page">
      {/* Top Header */}
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="admin-page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <Megaphone size={28} color="#dc2626" />
            Régie Publicitaire & Bannières
          </h1>
          <p style={{ color: '#6b7280', margin: '4px 0 0 0', fontSize: '14px' }}>
            Gérez vos encarts publicitaires, bannières visuelles pures, photos, vidéos et articles à la une.
          </p>
        </div>
        <button
          onClick={openNewModal}
          className="admin-btn admin-btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
        >
          <Plus size={18} />
          Nouvelle Campagne
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '13px', color: '#6b7280', textTransform: 'uppercase', fontWeight: '600' }}>Campagnes Actives</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#16a34a', marginTop: '4px' }}>
            {activeCount} <span style={{ fontSize: '14px', color: '#9ca3af', fontWeight: '400' }}>/ {banners.length}</span>
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '13px', color: '#6b7280', textTransform: 'uppercase', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Eye size={16} /> Total Impressions
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', marginTop: '4px' }}>
            {totalViews.toLocaleString('fr-FR')}
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '13px', color: '#6b7280', textTransform: 'uppercase', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MousePointerClick size={16} /> Total Clics
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#2563eb', marginTop: '4px' }}>
            {totalClicks.toLocaleString('fr-FR')}
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '13px', color: '#6b7280', textTransform: 'uppercase', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Percent size={16} /> Taux de Clic (CTR)
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#d97706', marginTop: '4px' }}>
            {averageCtr}%
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
        {[
          { id: 'all', label: 'Toutes les bannières' },
          { id: 'header', label: 'Haut de page' },
          { id: 'in_feed', label: 'Dans les articles' },
          { id: 'sidebar', label: 'Barre latérale' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterPlacement(tab.id)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: filterPlacement === tab.id ? '#1e293b' : '#f1f5f9',
              color: filterPlacement === tab.id ? '#fff' : '#475569',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Banner Table */}
      {filteredBanners.length === 0 ? (
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '60px 20px', textAlign: 'center', border: '1px dashed #d1d5db' }}>
          <Megaphone size={40} color="#9ca3af" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '700' }}>Aucun encart publicitaire</h3>
          <p style={{ color: '#6b7280', margin: '0 0 16px 0', fontSize: '14px' }}>
            Créez votre première campagne publicitaire avec photo, vidéo ou mise en avant d'un article.
          </p>
          <button onClick={openNewModal} className="admin-btn admin-btn-primary">
            <Plus size={16} style={{ marginRight: '6px' }} />
            Ajouter une bannière
          </button>
        </div>
      ) : (
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase', color: '#64748b' }}>
                <th style={{ width: '60px' }}>Ordre</th>
                <th style={{ width: '120px' }}>Visuel</th>
                <th>Campagne & Annonceur</th>
                <th>Emplacement</th>
                <th>Période</th>
                <th>Statistiques</th>
                <th style={{ width: '100px' }}>Statut</th>
                <th style={{ textAlign: 'right', width: '140px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBanners.map((banner, index) => {
                const ctr = banner.views_count > 0 ? (((banner.clicks_count || 0) / banner.views_count) * 100).toFixed(1) : 0;
                const isVideo = checkIsVideo(banner.image_url, banner.media_type);
                const coords = extractCoords(banner.image_url, banner.object_position);
                const hasText = Boolean(banner.title || banner.subtitle);
                return (
                  <tr key={banner.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <button
                          type="button"
                          onClick={() => handleMove(index, -1)}
                          disabled={index === 0}
                          style={{ border: 'none', background: 'none', cursor: index === 0 ? 'default' : 'pointer', color: index === 0 ? '#d1d5db' : '#4b5563', padding: '2px' }}
                          title="Monter"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMove(index, 1)}
                          disabled={index === filteredBanners.length - 1}
                          style={{ border: 'none', background: 'none', cursor: index === filteredBanners.length - 1 ? 'default' : 'pointer', color: index === filteredBanners.length - 1 ? '#d1d5db' : '#4b5563', padding: '2px' }}
                          title="Descendre"
                        >
                          <ArrowDown size={14} />
                        </button>
                      </div>
                    </td>
                    <td>
                      {banner.image_url ? (
                        <div style={{ width: '100px', height: '60px', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#0f172a', position: 'relative' }}>
                          {isVideo ? (
                            <>
                              <video src={banner.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${coords.x}% ${coords.y}%` }} muted />
                              <span style={{ position: 'absolute', bottom: '3px', right: '3px', backgroundColor: 'rgba(0,0,0,0.7)', color: '#ffce00', padding: '2px 4px', borderRadius: '3px', fontSize: '9px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                <Play size={8} /> VIDÉO
                              </span>
                            </>
                          ) : (
                            <img src={banner.image_url} alt={banner.title || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${coords.x}% ${coords.y}%` }} />
                          )}
                        </div>
                      ) : (
                        <div style={{ width: '100px', height: '60px', borderRadius: '6px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                          <Megaphone size={18} />
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: '700', fontSize: '15px', color: '#111827', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span>{banner.title || '[Bannière sans nom]'}</span>
                        {banner.is_media_only && (
                          <span style={{ fontSize: '11px', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '1px 8px', borderRadius: '4px', fontWeight: '800' }}>
                            Visuel pur (aucun texte sur le site)
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#6b7280' }}>
                        {banner.badge_text && (
                          <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>
                            {banner.badge_text}
                          </span>
                        )}
                        {banner.sponsor_name && <span>{banner.sponsor_name}</span>}
                        {banner.link_url && (
                          <a href={banner.link_url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                            <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '4px', backgroundColor: '#f1f5f9', fontWeight: '600', color: '#334155' }}>
                        {banner.placement === 'header' ? 'Haut de page' : banner.placement === 'sidebar' ? 'Sidebar' : banner.placement === 'in_feed' ? 'Articles' : 'Tous'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', color: '#4b5563' }}>
                        {banner.start_date || banner.end_date ? (
                          <>
                            <div>Du {banner.start_date ? new Date(banner.start_date).toLocaleDateString('fr-FR') : 'Début'}</div>
                            <div>Au {banner.end_date ? new Date(banner.end_date).toLocaleDateString('fr-FR') : 'Illimité'}</div>
                          </>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>Permanent</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px' }}>
                        <div><strong>{banner.views_count || 0}</strong> vues</div>
                        <div><strong>{banner.clicks_count || 0}</strong> clics <span style={{ color: '#10b981' }}>({ctr}%)</span></div>
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleToggle(banner)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          fontWeight: '700',
                          color: banner.is_active ? '#15803d' : '#9ca3af',
                        }}
                      >
                        {banner.is_active ? <CheckCircle2 size={16} color="#16a34a" /> : <XCircle size={16} color="#9ca3af" />}
                        {banner.is_active ? 'Actif' : 'Pause'}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => openEditModal(banner)}
                          className="btn-icon btn-edit"
                          title="Modifier"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(banner.id)}
                          className="btn-icon btn-delete"
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL CRÉATION / ÉDITION */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '16px',
              maxWidth: '720px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>
                  {editingBanner ? 'Modifier l’encart publicitaire' : 'Créer un nouvel encart publicitaire'}
                </h2>
                <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                  Bannières photos, vidéos, articles ou affichage 100% visuel sans texte.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} style={{ padding: '24px' }}>
              
              {/* ACTION : IMPORTER DEPUIS UN ARTICLE */}
              <div style={{ marginBottom: '16px', padding: '14px 16px', borderRadius: '10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={18} color="#16a34a" />
                    <div>
                      <strong style={{ fontSize: '14px', color: '#166534' }}>Mettre en avant un article du site</strong>
                      <div style={{ fontSize: '12px', color: '#15803d' }}>
                        Importez en 1 clic le titre, le texte, l'image et le lien d'un article.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowArticlePicker(!showArticlePicker)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #16a34a',
                      backgroundColor: '#fff',
                      color: '#166534',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <FileText size={14} />
                    {showArticlePicker ? 'Fermer le sélecteur' : 'Choisir un article'}
                  </button>
                </div>

                {/* SÉLECTEUR D'ARTICLE DÉPLIÉ */}
                {showArticlePicker && (
                  <div style={{ marginTop: '14px', borderTop: '1px solid #bbf7d0', paddingTop: '12px' }}>
                    <div style={{ position: 'relative', marginBottom: '10px' }}>
                      <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                      <input
                        type="text"
                        value={articleSearchQuery}
                        onChange={(e) => setArticleSearchQuery(e.target.value)}
                        placeholder="Rechercher par titre, catégorie ou auteur..."
                        style={{
                          width: '100%',
                          padding: '8px 12px 8px 34px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '13px',
                        }}
                      />
                    </div>
                    <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {filteredArticles.length === 0 ? (
                        <div style={{ fontSize: '12px', color: '#64748b', padding: '8px' }}>Aucun article trouvé.</div>
                      ) : (
                        filteredArticles.map((art) => (
                          <div
                            key={art.id}
                            onClick={() => handleSelectArticle(art)}
                            style={{
                              padding: '8px 10px',
                              borderRadius: '6px',
                              backgroundColor: '#fff',
                              border: '1px solid #e2e8f0',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              transition: 'background 0.2s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
                          >
                            {art.image_url && (
                              <img src={art.image_url} alt="" style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {art.title}
                              </div>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>
                                {art.category || 'Actualité'} • {art.author || 'Rédaction'}
                              </div>
                            </div>
                            <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: '700', whiteSpace: 'nowrap' }}>
                              Sélectionner ➔
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* OPTION : BANNIÈRE 100% VISUELLE SANS AUCUN TEXTE */}
              <div
                style={{
                  marginBottom: '20px',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  backgroundColor: isMediaOnly ? '#eff6ff' : '#f8fafc',
                  border: `2px solid ${isMediaOnly ? '#2563eb' : '#e2e8f0'}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="checkbox"
                    id="mediaOnlyToggle"
                    checked={isMediaOnly}
                    onChange={(e) => {
                      setIsMediaOnly(e.target.checked);
                      if (e.target.checked) {
                        setSubtitle('');
                        setSponsorName('');
                        setBadgeText('');
                        setCtaText('');
                      }
                    }}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <div>
                    <label htmlFor="mediaOnlyToggle" style={{ fontSize: '14px', fontWeight: '800', color: isMediaOnly ? '#1e40af' : '#1e293b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <EyeOff size={16} />
                      Bannière 100% visuelle (sans texte, sans titre ni mention)
                    </label>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      Affiche uniquement votre photo ou vidéo plein écran, sans ombre ni bouton CTA.
                    </div>
                  </div>
                </div>
                {!isMediaOnly && (
                  <button
                    type="button"
                    onClick={clearAllTexts}
                    style={{
                      fontSize: '12px',
                      color: '#dc2626',
                      background: 'none',
                      border: '1px solid #fca5a5',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                    }}
                  >
                    Effacer tous les textes
                  </button>
                )}
              </div>

              {/* UPLOAD VISUEL: PHOTO OU VIDÉO AVEC REPOSITIONNEMENT */}
              <div className="admin-form-group" style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="admin-form-label" style={{ margin: 0, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Film size={16} color="#dc2626" />
                    Visuel publicitaire (Photo ou Vidéo) *
                  </label>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Formats : JPG, PNG, WebP, MP4, WebM
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      if (checkIsVideo(e.target.value)) setMediaType('video');
                      else setMediaType('image');
                    }}
                    placeholder="URL directe (https://...) ou uploadez un fichier photo/vidéo"
                    className="admin-form-control"
                    style={{ flex: 1, margin: 0 }}
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleMediaUpload}
                    accept="image/*,video/*"
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingMedia}
                    className="admin-btn"
                    style={{ backgroundColor: '#1e293b', color: '#fff', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Upload size={14} />
                    {uploadingMedia ? 'Upload en cours...' : 'Uploader Photo / Vidéo'}
                  </button>
                </div>

                {/* OUTIL DE REPOSITIONNEMENT ET CADRAGE */}
                {imageUrl && (
                  <div style={{ marginTop: '16px', padding: '14px', borderRadius: '8px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <strong style={{ fontSize: '13px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Move size={15} color="#2563eb" />
                        Replacer / Cadrer la photo ou vidéo
                      </strong>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>
                        Axe X: {positionX}% • Axe Y: {positionY}%
                      </span>
                    </div>

                    {/* Raccourcis de position 9-points */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      {[
                        { label: 'Haut', x: 50, y: 0 },
                        { label: 'Centre', x: 50, y: 50 },
                        { label: 'Bas', x: 50, y: 100 },
                        { label: 'Gauche', x: 0, y: 50 },
                        { label: 'Droite', x: 100, y: 50 },
                        { label: 'Haut-G.', x: 0, y: 0 },
                        { label: 'Haut-D.', x: 100, y: 0 },
                      ].map((pos) => (
                        <button
                          key={pos.label}
                          type="button"
                          onClick={() => {
                            setPositionX(pos.x);
                            setPositionY(pos.y);
                          }}
                          style={{
                            fontSize: '11px',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            border: '1px solid #cbd5e1',
                            backgroundColor: positionX === pos.x && positionY === pos.y ? '#2563eb' : '#f8fafc',
                            color: positionX === pos.x && positionY === pos.y ? '#fff' : '#334155',
                            cursor: 'pointer',
                            fontWeight: '700',
                          }}
                        >
                          {pos.label}
                        </button>
                      ))}
                    </div>

                    {/* Curseurs de réglage fin X et Y */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#475569', marginBottom: '3px' }}>
                          <span>Gauche ↔ Droite</span>
                          <strong>{positionX}%</strong>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={positionX}
                          onChange={(e) => setPositionX(Number(e.target.value))}
                          style={{ width: '100%', cursor: 'pointer' }}
                        />
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#475569', marginBottom: '3px' }}>
                          <span>Haut ↕ Bas</span>
                          <strong>{positionY}%</strong>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={positionY}
                          onChange={(e) => setPositionY(Number(e.target.value))}
                          style={{ width: '100%', cursor: 'pointer' }}
                        />
                      </div>
                    </div>

                    {/* Aperçu direct du cadrage */}
                    <div style={{ width: '100%', height: '140px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#090d16', border: '1px solid #94a3b8', position: 'relative' }}>
                      {checkIsVideo(imageUrl, mediaType) ? (
                        <video
                          src={imageUrl}
                          autoPlay
                          loop
                          muted
                          playsInline
                          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${positionX}% ${positionY}%` }}
                        />
                      ) : (
                        <img
                          src={imageUrl}
                          alt="Cadrage"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${positionX}% ${positionY}%` }}
                        />
                      )}
                      <div style={{ position: 'absolute', bottom: '6px', right: '8px', backgroundColor: 'rgba(0,0,0,0.7)', color: '#ffce00', fontSize: '10px', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                        Aperçu cadrage en direct
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* CHAMPS TEXTES (ADAPTÉS SELON LE MODE VISUEL PUR OU STANDARD) */}
              {isMediaOnly ? (
                <div className="admin-form-group" style={{ backgroundColor: '#eff6ff', padding: '16px', borderRadius: '10px', border: '1.5px solid #93c5fd' }}>
                  <label className="admin-form-label" style={{ fontWeight: '800', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', marginBottom: '6px' }}>
                    <Tag size={16} />
                    Intitulé / Nom de repère interne (visible uniquement en administration)
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Campagne Srefidensi Suriname, Affiche Promo Partenaire..."
                    className="admin-form-control"
                    style={{ backgroundColor: '#fff', borderColor: '#60a5fa', fontWeight: '600' }}
                  />
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '6px', lineHeight: '1.4' }}>
                    💡 <strong>Mode visuel pur activé</strong> : Ce titre sert exclusivement de repère dans votre tableau de bord admin pour identifier et classer vos campagnes. <u>Aucun texte ni bouton ne sera affiché sur le site web</u>.
                  </div>
                </div>
              ) : (
                <>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Titre de la campagne *</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ex: Nouvelle édition de La Folle du Couvent disponible !"
                      className="admin-form-control"
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Sous-titre / Message descriptif</label>
                    <textarea
                      rows={2}
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder="Ex: Découvrez le reportage exclusif et toutes les vidéos en direct sur notre chaîne."
                      className="admin-form-control"
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  <div className="admin-form-row">
                    <div className="admin-form-group">
                      <label className="admin-form-label">Nom de l'Annonceur / Auteur</label>
                      <input
                        type="text"
                        value={sponsorName}
                        onChange={(e) => setSponsorName(e.target.value)}
                        placeholder="Ex: AFOLUKU TV / Partenaire"
                        className="admin-form-control"
                      />
                    </div>

                    <div className="admin-form-group">
                      <label className="admin-form-label">Badge publicitaire</label>
                      <input
                        type="text"
                        value={badgeText}
                        onChange={(e) => setBadgeText(e.target.value)}
                        placeholder="Ex: Sponsorisé"
                        className="admin-form-control"
                      />
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                        {BADGE_PRESETS.map((bp) => (
                          <button
                            key={bp}
                            type="button"
                            onClick={() => setBadgeText(bp)}
                            style={{
                              fontSize: '11px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: '1px solid #d1d5db',
                              background: badgeText === bp ? '#ffce00' : '#f9fafb',
                              cursor: 'pointer',
                            }}
                          >
                            {bp}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Texte du bouton (CTA)</label>
                    <input
                      type="text"
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value)}
                      placeholder="Ex: Lire l’article ou En savoir plus"
                      className="admin-form-control"
                    />
                  </div>
                </>
              )}

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">Emplacement</label>
                  <select
                    value={placement}
                    onChange={(e) => setPlacement(e.target.value)}
                    className="admin-form-control"
                  >
                    {PLACEMENTS.map((p) => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Lien de redirection au clic (optionnel)</label>
                  <input
                    type="text"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="Ex: /fr/article/mon-article ou https://site-partenaire.com"
                    className="admin-form-control"
                  />
                </div>
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">Date de début (optionnel)</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="admin-form-control"
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Date de fin (optionnel)</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="admin-form-control"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                <label htmlFor="isActiveCheck" style={{ fontSize: '14px', fontWeight: '600', color: '#374151', cursor: 'pointer' }}>
                  Campagne active immédiatement
                </label>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="admin-btn"
                  style={{ backgroundColor: '#f3f4f6', color: '#374151' }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingMedia}
                  className="admin-btn admin-btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Save size={16} />
                  {saving ? 'Enregistrement...' : editingBanner ? 'Mettre à jour' : 'Créer la campagne'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
