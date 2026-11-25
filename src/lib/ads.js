import { supabase } from './supabase';

const SETTINGS_KEY = 'ad_banners_config';

/**
 * Lit toutes les bannières actives depuis Supabase (table ad_banners ou site_settings)
 */
export async function getActiveBanners(placement = null) {
  try {
    // 1. Essayer la table dédiée ad_banners
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
      return data.filter(b => {
        if (!b.is_active) return false;
        if (b.start_date && new Date(b.start_date) > now) return false;
        if (b.end_date && new Date(b.end_date) < now) return false;
        return true;
      });
    }

    // 2. Repli transparent sur site_settings
    const { data: settingsData } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', SETTINGS_KEY)
      .maybeSingle();

    if (settingsData?.value?.banners) {
      const now = new Date();
      let list = settingsData.value.banners.filter(b => b.is_active);
      if (placement && placement !== 'all') {
        list = list.filter(b => b.placement === placement || b.placement === 'all' || !b.placement);
      }
      return list
        .filter(b => {
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
    const { data, error } = await supabase
      .from('ad_banners')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (!error && data) return data;

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
  try {
    const bannerId = banner.id || `ad_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
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

    // Tentative 1 : Table dédiée
    const { error } = await supabase
      .from('ad_banners')
      .upsert(bannerPayload);

    if (!error) return { success: true, banner: bannerPayload };

    // Tentative 2 : Stockage dans site_settings
    const { data: currentSettings } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', SETTINGS_KEY)
      .maybeSingle();

    const currentBanners = currentSettings?.value?.banners || [];
    const index = currentBanners.findIndex(b => b.id === bannerId);

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
      updated_at: new Date().toISOString()
    });

    return { success: true, banner: bannerPayload };
  } catch (err) {
    console.error('Erreur saveBannerData:', err);
    throw err;
  }
}

/**
 * Supprime une bannière
 */
export async function deleteBannerData(bannerId) {
  try {
    // 1. Table
    const { error } = await supabase
      .from('ad_banners')
      .delete()
      .eq('id', bannerId);

    if (!error) return { success: true };

    // 2. Settings
    const { data: currentSettings } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', SETTINGS_KEY)
      .maybeSingle();

    const currentBanners = currentSettings?.value?.banners || [];
    const filtered = currentBanners.filter(b => b.id !== bannerId);

    await supabase.from('site_settings').upsert({
      key: SETTINGS_KEY,
      value: { enabled: true, banners: filtered },
      updated_at: new Date().toISOString()
    });

    return { success: true };
  } catch (err) {
    console.error('Erreur deleteBannerData:', err);
    throw err;
  }
}

/**
 * Incrémente les vues (impression)
 */
export async function recordImpression(bannerId) {
  try {
    // Essai RPC si présent
    const { error } = await supabase.rpc('increment_ad_view', { banner_id: bannerId });
    if (!error) return;

    // Sinon mise à jour directe
    const { data: banner } = await supabase
      .from('ad_banners')
      .select('views_count')
      .eq('id', bannerId)
      .maybeSingle();

    if (banner) {
      await supabase
        .from('ad_banners')
        .update({ views_count: (banner.views_count || 0) + 1 })
        .eq('id', bannerId);
      return;
    }

    // Repli sur site_settings
    const { data: settingsData } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', SETTINGS_KEY)
      .maybeSingle();

    if (settingsData?.value?.banners) {
      const banners = settingsData.value.banners.map(b => 
        b.id === bannerId ? { ...b, views_count: (b.views_count || 0) + 1 } : b
      );
      await supabase.from('site_settings').upsert({
        key: SETTINGS_KEY,
        value: { ...settingsData.value, banners },
        updated_at: new Date().toISOString()
      });
    }
  } catch (e) {
    // Silencieux pour ne pas bloquer l'affichage
  }
}

/**
 * Incrémente les clics
 */
export async function recordClick(bannerId) {
  try {
    const { error } = await supabase.rpc('increment_ad_click', { banner_id: bannerId });
    if (!error) return;

    const { data: banner } = await supabase
      .from('ad_banners')
      .select('clicks_count')
      .eq('id', bannerId)
      .maybeSingle();

    if (banner) {
      await supabase
        .from('ad_banners')
        .update({ clicks_count: (banner.clicks_count || 0) + 1 })
        .eq('id', bannerId);
      return;
    }

    const { data: settingsData } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', SETTINGS_KEY)
      .maybeSingle();

    if (settingsData?.value?.banners) {
      const banners = settingsData.value.banners.map(b => 
        b.id === bannerId ? { ...b, clicks_count: (b.clicks_count || 0) + 1 } : b
      );
      await supabase.from('site_settings').upsert({
        key: SETTINGS_KEY,
        value: { ...settingsData.value, banners },
        updated_at: new Date().toISOString()
      });
    }
  } catch (e) {
    // Silencieux
  }
}
