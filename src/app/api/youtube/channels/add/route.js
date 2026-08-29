import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

function extractChannelInfo(input) {
  // Returns { type: 'handle' | 'id', value: string } or null
  const str = input.trim();
  
  if (str.startsWith('UC') && str.length === 24) {
    return { type: 'id', value: str };
  }
  
  if (str.startsWith('@')) {
    return { type: 'handle', value: str };
  }

  // URLs
  const urlMatch = str.match(/youtube\.com\/(c\/|channel\/|@)([^\/\?]+)/);
  if (urlMatch) {
    const typeStr = urlMatch[1];
    const valueStr = urlMatch[2];
    
    if (typeStr === 'channel/') return { type: 'id', value: valueStr };
    if (typeStr === '@') return { type: 'handle', value: '@' + valueStr };
    
    // For old /c/ custom URLs, sometimes they match handles or require a search, 
    // but we'll try it as a handle for now.
    return { type: 'handle', value: '@' + valueStr };
  }

  return null;
}

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { input, sector } = await request.json();

    if (!input || !sector) {
      return NextResponse.json({ error: 'L\'URL/Handle de la chaîne et le secteur sont requis' }, { status: 400 });
    }

    const channelInfo = extractChannelInfo(input);
    if (!channelInfo) {
      return NextResponse.json({ error: 'Format de chaîne invalide (utilisez l\'URL, l\'ID UC... ou le Handle @...)' }, { status: 400 });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    let ytUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&key=${apiKey}`;
    
    if (channelInfo.type === 'id') {
      ytUrl += `&id=${channelInfo.value}`;
    } else {
      ytUrl += `&forHandle=${channelInfo.value}`;
    }
    
    const ytResponse = await fetch(ytUrl);
    const ytData = await ytResponse.json();

    if (!ytData.items || ytData.items.length === 0) {
      return NextResponse.json({ error: 'Chaîne introuvable sur YouTube' }, { status: 404 });
    }

    const channel = ytData.items[0];
    const snippet = channel.snippet;
    const stats = channel.statistics;
    const channelId = channel.id;

    // Thumbnail
    const thumbnail = snippet.thumbnails.high?.url || snippet.thumbnails.medium?.url || snippet.thumbnails.default?.url;

    // 1. Sauvegarder dans youtube_channels
    const { data: channelData, error: dbError } = await supabase
      .from('youtube_channels')
      .upsert({
        channel_id: channelId,
        title: snippet.title,
        sector: sector,
        thumbnail_url: thumbnail
      }, { onConflict: 'channel_id' })
      .select()
      .single();

    if (dbError) throw dbError;

    // 2. Ajouter la première entrée dans l'historique
    const { error: historyError } = await supabase
      .from('youtube_channel_stats_history')
      .insert({
        channel_id: channelId,
        views: parseInt(stats.viewCount || 0, 10),
        subscribers: parseInt(stats.subscriberCount || 0, 10),
        video_count: parseInt(stats.videoCount || 0, 10)
      });

    if (historyError) throw historyError;

    return NextResponse.json({ success: true, channel: channelData });

  } catch (error) {
    console.error('Erreur ajout youtube channel:', error);
    require('fs').writeFileSync('/Users/studiojls/.gemini/antigravity/scratch/A FOLUKU TV/add_error.log', error.stack || error.message);
    return NextResponse.json({ error: 'Erreur interne du serveur', details: error.message }, { status: 500 });
  }
}
