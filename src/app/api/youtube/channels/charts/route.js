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
      .from('youtube_channels')
      .select(`
        *,
        youtube_channel_stats_history (
          views, subscribers, video_count, recorded_at
        )
      `);

    if (sector !== 'all') {
      query = query.eq('sector', sector);
    }

    const { data: channels, error } = await query;
    if (error) throw error;

    const results = await Promise.all(channels.map(async (channel) => {
      const history = (channel.youtube_channel_stats_history || []).sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at));
      
      if (history.length === 0) return null;

      const latestStats = history[0];
      let viewsGained = 0;
      let subsGained = 0;
      let videosGained = 0;
      let hasBaseline = true;

      // Si l'API Social Blade est configurée et qu'on demande une période 7j/30j
      if ((period === '7_days' || period === '30_days') && process.env.SOCIALBLADE_CLIENT_ID && process.env.SOCIALBLADE_CLIENT_TOKEN) {
        const sbData = await fetchSocialBladeChannelStats(channel.channel_id || channel.title);
        if (sbData && sbData.gains[period]) {
          viewsGained = sbData.gains[period].views;
          subsGained = sbData.gains[period].subscribers;
          return {
            ...channel,
            current_views: latestStats.views,
            current_subscribers: latestStats.subscribers,
            current_video_count: latestStats.video_count,
            views_gained: viewsGained,
            subs_gained: subsGained,
            videos_gained: videosGained,
            has_baseline: true,
            is_socialblade: true,
            youtube_channel_stats_history: undefined
          };
        }
      }

      if (period === 'all_time') {
        viewsGained = latestStats.views;
        subsGained = latestStats.subscribers;
        videosGained = latestStats.video_count;
      } else {
        let cutoffDate = new Date();
        if (period === '7_days') cutoffDate.setDate(cutoffDate.getDate() - 7);
        else if (period === '30_days') cutoffDate.setDate(cutoffDate.getDate() - 30);
        else if (period === '365_days') cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);

        const pastEntry = history.find(h => new Date(h.recorded_at) <= cutoffDate);

        if (pastEntry && pastEntry.recorded_at !== latestStats.recorded_at) {
          viewsGained = Math.max(0, latestStats.views - pastEntry.views);
          subsGained = Math.max(0, latestStats.subscribers - pastEntry.subscribers);
          videosGained = Math.max(0, latestStats.video_count - pastEntry.video_count);
        } else if (history.length > 1) {
          const oldestEntry = history[history.length - 1];
          viewsGained = Math.max(0, latestStats.views - oldestEntry.views);
          subsGained = Math.max(0, latestStats.subscribers - oldestEntry.subscribers);
          videosGained = Math.max(0, latestStats.video_count - oldestEntry.video_count);
        } else {
          viewsGained = 0;
          subsGained = 0;
          videosGained = 0;
          hasBaseline = false;
        }
      }

      return {
        ...channel,
        current_views: latestStats.views,
        current_subscribers: latestStats.subscribers,
        current_video_count: latestStats.video_count,
        views_gained: viewsGained,
        subs_gained: subsGained,
        videos_gained: videosGained,
        has_baseline: hasBaseline,
        youtube_channel_stats_history: undefined 
      };
    }));

    const cleanResults = results.filter(c => c !== null);

    // Sort
    cleanResults.sort((a, b) => {
      if (period === 'all_time') {
        return sortBy === 'subscribers' ? b.current_subscribers - a.current_subscribers : b.current_views - a.current_views;
      } else {
        const aVal = sortBy === 'subscribers' ? (a.has_baseline ? a.subs_gained : -1) : (a.has_baseline ? a.views_gained : -1);
        const bVal = sortBy === 'subscribers' ? (b.has_baseline ? b.subs_gained : -1) : (b.has_baseline ? b.views_gained : -1);
        
        if (bVal !== aVal) return bVal - aVal;
        return b.current_views - a.current_views;
      }
    });

    return NextResponse.json({ success: true, data: cleanResults, charts: cleanResults });

  } catch (error) {
    console.error('Erreur charts channels:', error);
    return NextResponse.json({ error: 'Erreur interne', details: error.message }, { status: 500 });
  }
}
