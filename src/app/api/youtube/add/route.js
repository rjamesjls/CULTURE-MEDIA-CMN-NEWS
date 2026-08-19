import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

function extractVideoId(url) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/);
  return match ? match[1] : null;
}

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { url, sector, artistName } = await request.json();

    if (!url || !sector) {
      return NextResponse.json({ error: 'URL et secteur sont requis' }, { status: 400 });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json({ error: 'URL YouTube invalide' }, { status: 400 });
    }

    // Appel à l'API YouTube
    const apiKey = process.env.YOUTUBE_API_KEY;
    const ytUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`;
    
    const ytResponse = await fetch(ytUrl);
    const ytData = await ytResponse.json();

    if (!ytData.items || ytData.items.length === 0) {
      return NextResponse.json({ error: 'Vidéo introuvable ou privée sur YouTube' }, { status: 404 });
    }

    const video = ytData.items[0];
    const snippet = video.snippet;
    const stats = video.statistics;

    // Thumbnail (on prend la maxres si dispo, sinon standard, sinon high)
    const thumbnail = snippet.thumbnails.maxres?.url || snippet.thumbnails.standard?.url || snippet.thumbnails.high?.url || snippet.thumbnails.default?.url;

    // Auto-extract artist name if not provided manually
    let finalArtistName = artistName?.trim();
    if (!finalArtistName) {
      // Common pattern: "Artist - Title" or "Artist | Title"
      const titleParts = snippet.title.split(/ - | \| | – /);
      if (titleParts.length > 1) {
        finalArtistName = titleParts[0].trim();
      } else {
        finalArtistName = snippet.channelTitle; // Fallback to channel name
      }
    }

    // 1. Sauvegarder dans youtube_videos
    const { data: videoData, error: dbError } = await supabase
      .from('youtube_videos')
      .upsert({
        video_id: videoId,
        title: snippet.title,
        channel_title: snippet.channelTitle,
        artist_name: finalArtistName,
        published_at: snippet.publishedAt,
        sector: sector,
        thumbnail_url: thumbnail
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // 2. Ajouter la première entrée dans l'historique
    const { error: historyError } = await supabase
      .from('youtube_stats_history')
      .insert({
        video_id: videoId,
        views: parseInt(stats.viewCount || 0, 10),
        likes: parseInt(stats.likeCount || 0, 10),
        comments: parseInt(stats.commentCount || 0, 10)
      });

    if (historyError) throw historyError;

    return NextResponse.json({ success: true, video: videoData });

  } catch (error) {
    console.error('Erreur ajout youtube:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur', details: error.message }, { status: 500 });
  }
}
