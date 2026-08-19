import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');

    if (!channelId) {
      return NextResponse.json({ error: 'channelId est requis' }, { status: 400 });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;

    // 1. Get the channel info (uploads playlist, statistics, etc)
    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails,statistics,snippet&id=${channelId}&key=${apiKey}`;
    const channelRes = await fetch(channelUrl);
    const channelData = await channelRes.json();

    if (!channelData.items || channelData.items.length === 0) {
      return NextResponse.json({ error: 'Chaîne introuvable' }, { status: 404 });
    }

    const channelItem = channelData.items[0];
    const uploadsPlaylistId = channelItem.contentDetails?.relatedPlaylists?.uploads;
    
    if (!uploadsPlaylistId) {
      return NextResponse.json({ error: 'Aucune vidéo trouvée pour cette chaîne' }, { status: 404 });
    }

    const channelStats = {
      title: channelItem.snippet.title,
      thumbnail: channelItem.snippet.thumbnails?.default?.url,
      subscribers: parseInt(channelItem.statistics.subscriberCount || 0, 10),
      views: parseInt(channelItem.statistics.viewCount || 0, 10),
      videoCount: parseInt(channelItem.statistics.videoCount || 0, 10)
    };

    // 2. Get the last 50 videos from the uploads playlist
    const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50&key=${apiKey}`;
    const playlistRes = await fetch(playlistUrl);
    const playlistData = await playlistRes.json();

    if (!playlistData.items || playlistData.items.length === 0) {
      return NextResponse.json({ videos: [] });
    }

    const videoIds = playlistData.items.map(item => item.contentDetails.videoId).join(',');

    // 3. Get statistics and snippet for these videos
    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds}&key=${apiKey}`;
    const videosRes = await fetch(videosUrl);
    const videosData = await videosRes.json();

    if (!videosData.items) {
      return NextResponse.json({ videos: [] });
    }

    const videos = videosData.items.map(video => ({
      id: video.id,
      title: video.snippet.title,
      publishedAt: video.snippet.publishedAt,
      thumbnail: video.snippet.thumbnails?.medium?.url || video.snippet.thumbnails?.default?.url,
      views: parseInt(video.statistics.viewCount || 0, 10),
      likes: parseInt(video.statistics.likeCount || 0, 10),
      comments: parseInt(video.statistics.commentCount || 0, 10)
    }));

    // Sort by newest first
    videos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    return NextResponse.json({ success: true, videos, channel: channelStats });

  } catch (error) {
    console.error('Erreur youtube channel videos:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur', details: error.message }, { status: 500 });
  }
}
