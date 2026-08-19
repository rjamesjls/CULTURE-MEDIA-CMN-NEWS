import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ error: 'La recherche est vide' }, { status: 400 });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;

    // 1. Search for videos
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=20&q=${encodeURIComponent(query)}&key=${apiKey}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData.items || searchData.items.length === 0) {
      return NextResponse.json({ success: true, videos: [] });
    }

    const videoIds = searchData.items.map(item => item.id.videoId).join(',');

    // 2. Get statistics and snippet for these videos
    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds}&key=${apiKey}`;
    const videosRes = await fetch(videosUrl);
    const videosData = await videosRes.json();

    if (!videosData.items) {
      return NextResponse.json({ success: true, videos: [] });
    }

    const videos = videosData.items.map(video => ({
      id: video.id,
      title: video.snippet.title,
      channelTitle: video.snippet.channelTitle,
      publishedAt: video.snippet.publishedAt,
      thumbnail: video.snippet.thumbnails?.medium?.url || video.snippet.thumbnails?.default?.url,
      views: parseInt(video.statistics.viewCount || 0, 10),
      likes: parseInt(video.statistics.likeCount || 0, 10),
      comments: parseInt(video.statistics.commentCount || 0, 10)
    }));

    // Sort by views descending (optional, or let relevance from search dictate)
    videos.sort((a, b) => b.views - a.views);

    return NextResponse.json({ success: true, videos });

  } catch (error) {
    console.error('Erreur youtube search:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur', details: error.message }, { status: 500 });
  }
}
