import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { fetchSocialBladeChannelStats } from '@/lib/socialblade';

export async function GET(request) {
  try {
    const supabase = await createClient();
    
    const { searchParams } = new URL(request.url);
    const sector = searchParams.get('sector') || 'all';
    const period = searchParams.get('period') || 'all_time';
    const sortBy = searchParams.get('sort') || searchParams.get('sortBy') || 'views';

    let query = supabase
      .from('youtube_videos')
      .select(`
        *,
        youtube_stats_history (
          views, likes, comments, recorded_at
        )
      `);

    if (sector !== 'all') {
      query = query.eq('sector', sector);
    }

    const { data: videos, error } = await query;
    if (error) throw error;

    const results = await Promise.all(videos.map(async (video) => {
      const history = (video.youtube_stats_history || []).sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at));
      
      if (history.length === 0) return null;

      const latestStats = history[0];
      let viewsGained = 0;
      let likesGained = 0;
      let hasBaseline = true;

      // Si Social Blade est disponible et qu'on demande une période 7j/30j
      if ((period === '7_days' || period === '30_days') && process.env.SOCIALBLADE_CLIENT_ID && process.env.SOCIALBLADE_CLIENT_TOKEN) {
        if (video.channel_title || video.artist_name) {
          const sbData = await fetchSocialBladeChannelStats(video.channel_title || video.artist_name);
          if (sbData && sbData.gains[period]) {
            viewsGained = sbData.gains[period].views;
            return {
              ...video,
              current_views: latestStats.views,
              current_likes: latestStats.likes,
              views_gained: viewsGained,
              likes_gained: likesGained,
              has_baseline: true,
              is_socialblade: true,
              youtube_stats_history: undefined
            };
          }
        }
      }

      if (period === 'all_time') {
        viewsGained = latestStats.views;
        likesGained = latestStats.likes;
      } else {
        let cutoffDate = new Date();
        if (period === '7_days') cutoffDate.setDate(cutoffDate.getDate() - 7);
        else if (period === '30_days') cutoffDate.setDate(cutoffDate.getDate() - 30);
        else if (period === '365_days') cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);

        const publishedDate = video.published_at ? new Date(video.published_at) : null;
        const isRecentRelease = publishedDate && publishedDate >= cutoffDate;

        if (isRecentRelease) {
          viewsGained = latestStats.views;
          likesGained = latestStats.likes;
        } else {
          const pastEntry = history.find(h => new Date(h.recorded_at) <= cutoffDate);
          
          if (pastEntry && pastEntry.recorded_at !== latestStats.recorded_at) {
            viewsGained = Math.max(0, latestStats.views - pastEntry.views);
            likesGained = Math.max(0, latestStats.likes - pastEntry.likes);
          } else if (history.length > 1) {
            const oldestEntry = history[history.length - 1];
            viewsGained = Math.max(0, latestStats.views - oldestEntry.views);
            likesGained = Math.max(0, latestStats.likes - oldestEntry.likes);
          } else {
            viewsGained = 0;
            likesGained = 0;
            hasBaseline = false;
          }
        }
      }

      return {
        ...video,
        current_views: latestStats.views,
        current_likes: latestStats.likes,
        views_gained: viewsGained,
        likes_gained: likesGained,
        has_baseline: hasBaseline,
        youtube_stats_history: undefined
      };
    }));

    const cleanResults = results.filter(v => v !== null);

    // Tri dynamique
    cleanResults.sort((a, b) => {
      if (period === 'all_time') {
        return sortBy === 'likes' ? b.current_likes - a.current_likes : b.current_views - a.current_views;
      } else {
        const aVal = sortBy === 'likes' ? (a.has_baseline ? a.likes_gained : -1) : (a.has_baseline ? a.views_gained : -1);
        const bVal = sortBy === 'likes' ? (b.has_baseline ? b.likes_gained : -1) : (b.has_baseline ? b.views_gained : -1);
        
        if (bVal !== aVal) return bVal - aVal;
        return b.current_views - a.current_views;
      }
    });

    return NextResponse.json({ success: true, charts: cleanResults });

  } catch (error) {
    console.error('Erreur charts:', error);
    return NextResponse.json({ error: 'Erreur interne', details: error.message }, { status: 500 });
  }
}
