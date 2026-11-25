'use client';

import { useState, useRef } from 'react';
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
  Sliders
} from 'lucide-react';
import { saveBannerData, deleteBannerData } from '@/lib/ads';
import { supabase } from '@/lib/supabase';

const BADGE_PRESETS = [
  'Sponsorisé',
  'À la une',
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

export default function AdsAdminClient({ initialBanners = [] }) {
  const [banners, setBanners] = useState(initialBanners);
  const [filterPlacement, setFilterPlacement] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [sponsorName, setSponsorName] = useState('');
  const [badgeText, setBadgeText] = useState('Sponsorisé');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [ctaText, setCtaText] = useState('En savoir plus');
  const [placement, setPlacement] = useState('header');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);

  const fileInputRef = useRef(null);

  // Stats calculation
  const totalViews = banners.reduce((sum, b) => sum + (b.views_count || 0), 0);
  const totalClicks = banners.reduce((sum, b) => sum + (b.clicks_count || 0), 0);
  const activeCount = banners.filter((b) => b.is_active).length;
  const averageCtr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : 0;

  const openNewModal = () => {
    setEditingBanner(null);
    setTitle('');
    setSubtitle('');
    setSponsorName('');
    setBadgeText('Sponsorisé');
    setImageUrl('');
    setLinkUrl('');
    setCtaText('En savoir plus');
    setPlacement('header');
    setStartDate('');
    setEndDate('');
    setIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (banner) => {
    setEditingBanner(banner);
    setTitle(banner.title || '');
    setSubtitle(banner.subtitle || '');
    setSponsorName(banner.sponsor_name || '');
    setBadgeText(banner.badge_text || 'Sponsorisé');
    setImageUrl(banner.image_url || '');
    setLinkUrl(banner.link_url || '');
    setCtaText(banner.cta_text || 'En savoir plus');
    setPlacement(banner.placement || 'header');
    setStartDate(banner.start_date ? banner.start_date.substring(0, 10) : '');
    setEndDate(banner.end_date ? banner.end_date.substring(0, 10) : '');
    setIsActive(banner.is_active ?? true);
    setShowModal(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `ads/banner_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('media').getPublicUrl(fileName);
      setImageUrl(data.publicUrl);
    } catch (err) {
      alert("Erreur lors de l'upload : " + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title) {
      alert('Veuillez renseigner un titre pour la bannière.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        id: editingBanner?.id,
        title,
        subtitle,
        sponsor_name: sponsorName,
        badge_text: badgeText,
        image_url: imageUrl,
        link_url: linkUrl,
        cta_text: ctaText,
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
      alert('Erreur : ' + err.message);
    }
  };

  const handleMove = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= banners.length) return;

    const newBanners = [...banners];
    const [moved] = newBanners.splice(index, 1);
    newBanners.splice(targetIndex, 0, moved);

    // Mettre à jour display_order
    const reordered = newBanners.map((b, i) => ({ ...b, display_order: i }));
    setBanners(reordered);

    try {
      await Promise.all([
        saveBannerData(reordered[index]),
        saveBannerData(reordered[targetIndex]),
      ]);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredBanners = filterPlacement === 'all'
    ? banners
    : banners.filter((b) => b.placement === filterPlacement || b.placement === 'all');

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px 0' }}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 6px 0', fontFamily: 'var(--font-heading)' }}>
            Régie Publicitaire & Bannières
          </h1>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
            Gérez les campagnes de vos sponsors et partenaires sur AFOLUKU TV (Header, Articles, Sidebar).
          </p>
        </div>
        <button
          onClick={openNewModal}
          className="admin-btn admin-btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '14px' }}
        >
          <Plus size={18} />
          Créer un encart publicitaire
        </button>
      </div>

      {/* Cartes Statistiques Globales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: '#fff', padding: '18px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#6b7280', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600' }}>Bannières Actives</span>
            <Megaphone size={18} color="#2563eb" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#111827' }}>
            {activeCount} <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#9ca3af' }}>/ {banners.length}</span>
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '18px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#6b7280', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600' }}>Impressions / Vues</span>
            <Eye size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#111827' }}>
            {totalViews.toLocaleString('fr-FR')}
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '18px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#6b7280', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600' }}>Clics Partenaires</span>
            <MousePointerClick size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#111827' }}>
            {totalClicks.toLocaleString('fr-FR')}
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '18px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#6b7280', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600' }}>Taux de Clics (CTR)</span>
            <Percent size={18} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#111827' }}>
            {averageCtr}%
          </div>
        </div>
      </div>

      {/* Filtres par emplacement */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[{ id: 'all', label: 'Toutes les bannières' }, ...PLACEMENTS].map((p) => (
          <button
            key={p.id}
            onClick={() => setFilterPlacement(p.id)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: filterPlacement === p.id ? '1px solid #2563eb' : '1px solid #e5e7eb',
              backgroundColor: filterPlacement === p.id ? '#eff6ff' : '#fff',
              color: filterPlacement === p.id ? '#1d4ed8' : '#4b5563',
              fontWeight: filterPlacement === p.id ? '700' : '500',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Liste des Bannières */}
      {filteredBanners.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#fff', borderRadius: '12px', border: '1px dashed #d1d5db' }}>
          <Megaphone size={40} color="#9ca3af" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#111827' }}>Aucun encart publicitaire</h3>
          <p style={{ margin: '0 0 16px 0', color: '#6b7280', fontSize: '14px' }}>
            Créez votre première campagne publicitaire pour diffuser un encart sponsorisé sur le site.
          </p>
          <button onClick={openNewModal} className="admin-btn admin-btn-primary">
            Ajouter une bannière
          </button>
        </div>
      ) : (
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <table className="admin-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Ordre</th>
                <th style={{ width: '120px' }}>Visuel</th>
                <th>Campagne & Sponsor</th>
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
                return (
                  <tr key={banner.id}>
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
                        <div style={{ width: '100px', height: '60px', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
                          <img src={banner.image_url} alt={banner.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ) : (
                        <div style={{ width: '100px', height: '60px', borderRadius: '6px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                          <Megaphone size={18} />
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: '700', fontSize: '15px', color: '#111827', marginBottom: '2px' }}>
                        {banner.title}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#6b7280' }}>
                        <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>
                          {banner.badge_text || 'Sponsorisé'}
                        </span>
                        <span>{banner.sponsor_name || 'AFOLUKU TV'}</span>
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
            backgroundColor: 'rgba(0,0,0,0.6)',
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
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>
                {editingBanner ? 'Modifier l’encart publicitaire' : 'Créer un nouvel encart publicitaire'}
              </h2>
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
              <div className="admin-form-group">
                <label className="admin-form-label">Titre de la campagne *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Vol Cayenne - Paris à partir de 499€"
                  className="admin-form-control"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Sous-titre / Message descriptif</label>
                <textarea
                  rows={2}
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Ex: Réservez dès maintenant pour bénéficier de nos offres exclusives d'hiver."
                  className="admin-form-control"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">Nom de l'Annonceur / Sponsor</label>
                  <input
                    type="text"
                    value={sponsorName}
                    onChange={(e) => setSponsorName(e.target.value)}
                    placeholder="Ex: Air Guyane / Orange"
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

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">Emplacement du placement</label>
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
                  <label className="admin-form-label">Texte du bouton (CTA)</label>
                  <input
                    type="text"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    placeholder="Ex: En savoir plus"
                    className="admin-form-control"
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Lien de redirection (Clic)</label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="Ex: https://www.airguyane.com ou /fr/pro/air-guyane"
                  className="admin-form-control"
                />
              </div>

              {/* Visuel Image Upload */}
              <div className="admin-form-group">
                <label className="admin-form-label">Visuel publicitaire (Image)</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://... ou uploadez un fichier"
                    className="admin-form-control"
                    style={{ flex: 1, margin: 0 }}
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="admin-btn"
                    style={{ backgroundColor: '#f3f4f6', color: '#374151', whiteSpace: 'nowrap' }}
                  >
                    <Upload size={14} style={{ marginRight: '6px' }} />
                    {uploadingImage ? 'Upload...' : 'Parcourir'}
                  </button>
                </div>
                {imageUrl && (
                  <div style={{ marginTop: '10px', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb', width: '200px' }}>
                    <img src={imageUrl} alt="Aperçu" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
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
                <label htmlFor="isActiveCheck" style={{ fontSize: '14px', fontWeight: '600', color: '#111827', cursor: 'pointer' }}>
                  Diffuser immédiatement cette bannière
                </label>
              </div>

              {/* Modal Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '15px', borderTop: '1px solid #e5e7eb' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="admin-btn"
                  style={{ backgroundColor: '#f3f4f6', color: '#4b5563' }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="admin-btn admin-btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Save size={16} />
                  {saving ? 'Enregistrement...' : 'Enregistrer la campagne'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
