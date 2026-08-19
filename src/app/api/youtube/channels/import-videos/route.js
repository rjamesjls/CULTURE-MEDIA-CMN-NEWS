import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // 1. Get tracked channels
    const { data: channels, error: channelsError } = await supabase
      .from('youtube_channels')
      .select('channel_id, sector, title');

    if (channelsError) throw channelsError;
    if (!channels || channels.length === 0) {
      return NextResponse.json({ success: true, added: 0, message: "Aucune chaîne suivie." });
    }

    // 2. Get existing videos to avoid duplicates
    const { data: existingVideos, error: videosError } = await supabase
      .from('youtube_videos')
      .select('video_id');
      
    if (videosError) throw videosError;
    const existingVideoIds = new Set(existingVideos.map(v => v.video_id));

    const apiKey = process.env.YOUTUBE_API_KEY;
    let addedCount = 0;
    const errorsList = [];

    // 3. For each channel, fetch latest 5 videos
    for (const channel of channels) {
      try {
        // Get channel info to find the uploads playlist
        const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channel.channel_id}&key=${apiKey}`;
        const channelRes = await fetch(channelUrl);
        const channelData = await channelRes.json();

        if (!channelData.items || channelData.items.length === 0) continue;

        const uploadsPlaylistId = channelData.items[0].contentDetails?.relatedPlaylists?.uploads;
        if (!uploadsPlaylistId) continue;

        // Get latest 5 videos from uploads
        const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=5&key=${apiKey}`;
        const playlistRes = await fetch(playlistUrl);
        const playlistData = await playlistRes.json();

        if (!playlistData.items || playlistData.items.length === 0) continue;

        const newVideoIds = playlistData.items
          .map(item => item.contentDetails.videoId)
          .filter(id => !existingVideoIds.has(id)); // Only new videos

        if (newVideoIds.length === 0) continue;

        // Fetch stats and snippets for the new videos
        const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${newVideoIds.join(',')}&key=${apiKey}`;
        const videosRes = await fetch(videosUrl);
        const videosData = await videosRes.json();

        if (!videosData.items) continue;

        for (const video of videosData.items) {
          const snippet = video.snippet;
          const stats = video.statistics;
          const thumbnail = snippet.thumbnails.maxres?.url || snippet.thumbnails.standard?.url || snippet.thumbnails.high?.url || snippet.thumbnails.default?.url;
          
          let artistName = snippet.channelTitle;

          // Save to youtube_videos
          const { error: dbError } = await supabase
            .from('youtube_videos')
            .upsert({
              video_id: video.id,
              title: snippet.title,
              channel_title: snippet.channelTitle,
              artist_name: artistName,
              published_at: snippet.publishedAt,
              sector: channel.sector || 'Global',
              thumbnail_url: thumbnail
            });

          if (!dbError) {
            // Save initial stats to history
            await supabase
              .from('youtube_stats_history')
              .insert({
                video_id: video.id,
                views: parseInt(stats.viewCount || 0, 10),
                likes: parseInt(stats.likeCount || 0, 10),
                comments: parseInt(stats.commentCount || 0, 10)
              });
            
            existingVideoIds.add(video.id); // Prevent inserting same ID again
            addedCount++;
          }
        }

      } catch (err) {
        errorsList.push(`Erreur pour la chaîne ${channel.title}: ${err.message}`);
      }
    }

    return NextResponse.json({ 
      success: true, 
      added: addedCount, 
      errors: errorsList.length > 0 ? errorsList : undefined 
    });

  } catch (error) {
    console.error('Erreur auto-import videos:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur', details: error.message }, { status: 500 });
  }
}
