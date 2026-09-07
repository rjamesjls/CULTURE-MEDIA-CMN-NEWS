import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { fetchSocialBladeStats } from '@/lib/socialblade';

export async function GET(request) {
  try {
    const supabase = await createClient();
    
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') || 'all'; 
    const platform = searchParams.get('platform') || 'all';
    const period = searchParams.get('period') || 'all_time';
    const sortBy = searchParams.get('sort') || searchParams.get('sortBy') || 'followers';

    let query = supabase
      .from('content_creators')
      .select(`
        *,
        creator_stats_history (
          followers, likes, media_count, recorded_at
        )
      `);

    if (country !== 'all') {
      query = query.eq('country', country);
    }
    
    if (platform !== 'all') {
      query = query.eq('platform', platform);
    }

    const { data: creators, error } = await query;
    if (error) throw error;

    const results = await Promise.all(creators.map(async (creator) => {
      const history = (creator.creator_stats_history || []).sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at));
      
      if (history.length === 0) return null;

      const latestStats = history[0];
      let followersGained = 0;
      let likesGained = 0;
      let hasBaseline = true;

      // Si on demande une période de 7j/30j, on utilise l'API Social Blade en temps réel pour avoir les gains exacts
      if ((period === '7_days' || period === '30_days') && process.env.SOCIALBLADE_CLIENT_ID && process.env.SOCIALBLADE_CLIENT_TOKEN) {
        const sbData = await fetchSocialBladeStats(creator.username, creator.platform);
        if (sbData && sbData.gains[period]) {
          followersGained = sbData.gains[period].subscribers;
          return {
            ...creator,
            current_followers: latestStats.followers,
            current_likes: latestStats.likes,
            current_media_count: latestStats.media_count,
            followers_gained: followersGained,
            likes_gained: likesGained,
            has_baseline: true,
            is_socialblade: true,
            creator_stats_history: undefined
          };
        }
      }

      // Fallback sur la base de données locale si l'API n'est pas dispo
      const msInDay = 24 * 60 * 60 * 1000;
      let baselineStats = latestStats;
      
      if (period === '7_days') {
        const targetDate = new Date(Date.now() - 7 * msInDay);
        const pastRecord = history.find(h => new Date(h.recorded_at) <= targetDate);
        if (pastRecord) baselineStats = pastRecord;
        else {
          baselineStats = history[history.length - 1];
          hasBaseline = false;
        }
      } else if (period === '30_days') {
        const targetDate = new Date(Date.now() - 30 * msInDay);
        const pastRecord = history.find(h => new Date(h.recorded_at) <= targetDate);
        if (pastRecord) baselineStats = pastRecord;
        else {
          baselineStats = history[history.length - 1];
          hasBaseline = false;
        }
      } else if (period === 'all_time') {
        baselineStats = history[history.length - 1];
      }

      followersGained = latestStats.followers - baselineStats.followers;
      likesGained = latestStats.likes - baselineStats.likes;

      return {
        ...creator,
        current_followers: latestStats.followers,
        current_likes: latestStats.likes,
        current_media_count: latestStats.media_count,
        followers_gained: followersGained,
        likes_gained: likesGained,
        has_baseline: hasBaseline,
        is_socialblade: false,
        creator_stats_history: undefined // nettoyer pour le payload
      };
    }));

    const validResults = results.filter(r => r !== null);

    // Tri
    validResults.sort((a, b) => {
      if (period === 'all_time') {
        if (sortBy === 'followers') return b.current_followers - a.current_followers;
        if (sortBy === 'likes') return b.current_likes - a.current_likes;
      } else {
        if (sortBy === 'followers') return b.followers_gained - a.followers_gained;
        if (sortBy === 'likes') return b.likes_gained - a.likes_gained;
      }
      return 0;
    });

    return NextResponse.json({ success: true, data: validResults });

  } catch (error) {
    console.error('Error fetching creators charts:', error);
    return NextResponse.json({ error: 'Failed to fetch charts' }, { status: 500 });
  }
}
