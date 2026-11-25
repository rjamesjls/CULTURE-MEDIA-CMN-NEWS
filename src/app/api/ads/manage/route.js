import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SETTINGS_KEY = 'ad_banners_config';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET(request) {
  try {
    const supabase = getAdminClient();
    const { searchParams } = new URL(request.url);
    const placement = searchParams.get('placement');

    // 1. Essayer table ad_banners
    try {
      let query = supabase
        .from('ad_banners')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (placement && placement !== 'all') {
        query = query.or(`placement.eq.${placement},placement.eq.all`);
      }

      const { data, error } = await query;
      if (!error && data) {
        return NextResponse.json({ success: true, banners: data });
      }
    } catch (_) {}

    // 2. Repli sur site_settings
    const { data: settingsData } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', SETTINGS_KEY)
      .maybeSingle();

    let list = settingsData?.value?.banners || [];
    if (placement && placement !== 'all') {
      list = list.filter((b) => b.placement === placement || b.placement === 'all' || !b.placement);
    }
    list.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

    return NextResponse.json({ success: true, banners: list });
  } catch (err) {
    console.error('Error GET /api/ads/manage:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const banner = await request.json();
    if (!banner.title) {
      return NextResponse.json({ success: false, error: 'Titre manquant' }, { status: 400 });
    }

    const supabase = getAdminClient();
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

    // 1. Essayer table ad_banners
    try {
      const { error: tableError } = await supabase
        .from('ad_banners')
        .upsert(bannerPayload);
      if (!tableError) {
        return NextResponse.json({ success: true, banner: bannerPayload });
      }
    } catch (_) {}

    // 2. Sauvegarde dans site_settings avec Service Role (bypasse RLS)
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

    const { error: upsertErr } = await supabase.from('site_settings').upsert({
      key: SETTINGS_KEY,
      value: { enabled: true, banners: updatedList },
      updated_at: new Date().toISOString(),
    });

    if (upsertErr) {
      throw upsertErr;
    }

    return NextResponse.json({ success: true, banner: bannerPayload });
  } catch (err) {
    console.error('Error POST /api/ads/manage:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID manquant' }, { status: 400 });
    }

    const supabase = getAdminClient();

    // 1. Supprimer de table ad_banners
    try {
      await supabase.from('ad_banners').delete().eq('id', id);
    } catch (_) {}

    // 2. Supprimer de site_settings
    const { data: currentSettings } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', SETTINGS_KEY)
      .maybeSingle();

    const currentBanners = currentSettings?.value?.banners || [];
    const updatedList = currentBanners.filter((b) => b.id !== id);

    await supabase.from('site_settings').upsert({
      key: SETTINGS_KEY,
      value: { enabled: true, banners: updatedList },
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error DELETE /api/ads/manage:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
