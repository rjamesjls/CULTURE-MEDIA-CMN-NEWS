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

export async function POST(request) {
  try {
    const { action, bannerId } = await request.json();

    if (!bannerId) {
      return NextResponse.json({ error: 'Missing bannerId' }, { status: 400 });
    }

    const supabase = getAdminClient();
    const isClick = action === 'click';

    // 1. Mise à jour de la table ad_banners si elle existe
    try {
      const { data: banner } = await supabase
        .from('ad_banners')
        .select('views_count, clicks_count')
        .eq('id', bannerId)
        .maybeSingle();

      if (banner) {
        if (isClick) {
          await supabase
            .from('ad_banners')
            .update({ clicks_count: (banner.clicks_count || 0) + 1, updated_at: new Date().toISOString() })
            .eq('id', bannerId);
        } else {
          await supabase
            .from('ad_banners')
            .update({ views_count: (banner.views_count || 0) + 1, updated_at: new Date().toISOString() })
            .eq('id', bannerId);
        }
      }
    } catch (_) {}

    // 2. Mise à jour dans site_settings (stockage principal des bannières)
    try {
      const { data: settingsData } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', SETTINGS_KEY)
        .maybeSingle();

      if (settingsData?.value?.banners) {
        const banners = settingsData.value.banners;
        let found = false;

        const updatedBanners = banners.map((b) => {
          if (b.id === bannerId) {
            found = true;
            return {
              ...b,
              views_count: isClick ? (b.views_count || 0) : (b.views_count || 0) + 1,
              clicks_count: isClick ? (b.clicks_count || 0) + 1 : (b.clicks_count || 0),
            };
          }
          return b;
        });

        if (found) {
          await supabase
            .from('site_settings')
            .upsert({
              key: SETTINGS_KEY,
              value: { ...settingsData.value, banners: updatedBanners },
              updated_at: new Date().toISOString(),
            });
        }
      }
    } catch (dbErr) {
      console.error('Error updating site_settings for ad tracking:', dbErr);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in /api/ads/track:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
