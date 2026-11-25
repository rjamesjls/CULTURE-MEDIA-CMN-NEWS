import { supabase } from './supabase';

const SETTINGS_KEY = 'ad_banners_config';

/**
 * Lit toutes les bannières actives depuis Supabase (table ad_banners ou site_settings)
 */
export async function getActiveBanners(placement = null) {
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch(`/api/ads/manage?placement=${placement || 'all'}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.banners) {
          const now = new Date();
          return json.banners.filter((b) => {
            if (!b.is_active) return false;
            if (b.start_date && new Date(b.start_date) > now) return false;
            if (b.end_date && new Date(b.end_date) < now) return false;
            return true;
          });
        }
      }
    } catch (e) {
      console.warn('Fallback direct supabase getActiveBanners:', e);
    }
  }

  try {
    // 1. Essayer la table dédiée ad_banners
    try {
      let query = supabase
        .from('ad_banners')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (placement && placement !== 'all') {
        query = query.or(`placement.eq.${placement},placement.eq.all`);
      }

      const { data, error } = await query;

      if (!error && data) {
        const now = new Date();
        return data.filter((b) => {
          if (!b.is_active) return false;
          if (b.start_date && new Date(b.start_date) > now) return false;
          if (b.end_date && new Date(b.end_date) < now) return false;
          return true;
        });
      }
    } catch (_) {}

    // 2. Repli transparent sur site_settings
    const { data: settingsData } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', SETTINGS_KEY)
      .maybeSingle();

    if (settingsData?.value?.banners) {
      const now = new Date();
      let list = settingsData.value.banners.filter((b) => b.is_active);
      if (placement && placement !== 'all') {
        list = list.filter((b) => b.placement === placement || b.placement === 'all' || !b.placement);
      }
      return list
        .filter((b) => {
          if (b.start_date && new Date(b.start_date) > now) return false;
          if (b.end_date && new Date(b.end_date) < now) return false;
          return true;
        })
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    }

    return [];
  } catch (err) {
    console.error('Erreur getActiveBanners:', err);
    return [];
  }
}

/**
 * Récupère toutes les bannières pour l'administration (avec stats)
 */
export async function getAllBannersAdmin() {
  try {
    // 1. Table
    try {
      const { data, error } = await supabase
        .from('ad_banners')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (!error && data) return data;
    } catch (_) {}

    // 2. Settings
    const { data: settingsData } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', SETTINGS_KEY)
      .maybeSingle();

    return settingsData?.value?.banners || [];
  } catch (err) {
    console.error('Erreur getAllBannersAdmin:', err);
    return [];
  }
}

/**
 * Enregistre ou met à jour une bannière publicitaire
 */
export async function saveBannerData(banner) {
  if (typeof window !== 'undefined') {
    const res = await fetch('/api/ads/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(banner),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Erreur lors de l'enregistrement de la bannière.");
    }
    return json;
  }

  // Côté serveur
  const bannerId = banner.id || `ad_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const bannerPayload = {
    ...banner,
    id: bannerId,
    updated_at: new Date().toISOString(),
    views_count: banner.views_count || 0,
    clicks_count: banner.clicks_count || 0,
    display_order: banner.display_order ?? 0,
    is_active: banner.is_active ?? true,
    placement: banner.placement || 'header',
    created_at: banner.created_at || new Date().toISOString(),
  };

  try {
    await supabase.from('ad_banners').upsert(bannerPayload);
  } catch (_) {}

  const { data: currentSettings } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', SETTINGS_KEY)
    .maybeSingle();

  const currentBanners = currentSettings?.value?.banners || [];
  const index = currentBanners.findIndex((b) => b.id === bannerId);

  let updatedList;
  if (index >= 0) {
    updatedList = [...currentBanners];
    updatedList[index] = { ...updatedList[index], ...bannerPayload };
  } else {
    updatedList = [bannerPayload, ...currentBanners];
  }

  await supabase.from('site_settings').upsert({
    key: SETTINGS_KEY,
    value: { enabled: true, banners: updatedList },
    updated_at: new Date().toISOString(),
  });

  return { success: true, banner: bannerPayload };
}

/**
 * Supprime une bannière
 */
export async function deleteBannerData(bannerId) {
  if (typeof window !== 'undefined') {
    const res = await fetch(`/api/ads/manage?id=${encodeURIComponent(bannerId)}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Erreur lors de la suppression.');
    }
    return json;
  }

  try {
    await supabase.from('ad_banners').delete().eq('id', bannerId);
  } catch (_) {}

  const { data: currentSettings } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', SETTINGS_KEY)
    .maybeSingle();

  const currentBanners = currentSettings?.value?.banners || [];
  const updatedList = currentBanners.filter((b) => b.id !== bannerId);

  await supabase.from('site_settings').upsert({
    key: SETTINGS_KEY,
    value: { enabled: true, banners: updatedList },
    updated_at: new Date().toISOString(),
  });

  return { success: true };
}

/**
 * Comptabilise une impression (vue)
 */
export async function recordImpression(bannerId) {
  if (!bannerId) return;
  try {
    await fetch('/api/ads/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'impression', bannerId }),
    });
  } catch (_) {}
}

/**
 * Comptabilise un clic
 */
export async function recordClick(bannerId) {
  if (!bannerId) return;
  try {
    await fetch('/api/ads/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'click', bannerId }),
    });
  } catch (_) {}
}
