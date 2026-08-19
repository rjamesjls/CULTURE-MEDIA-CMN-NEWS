import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request) {
  try {
    // Vérifier l'autorisation si on veut sécuriser le CRON (ex: un header secret)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
       // On peut l'ignorer pour l'instant ou rajouter une sécurité
    }

    const supabase = await createClient();

    // Récupérer toutes les vidéos suivies
    const { data: videos, error: dbError } = await supabase
      .from('youtube_videos')
      .select('video_id');

    if (dbError) throw dbError;
    if (!videos || videos.length === 0) {
      return NextResponse.json({ message: 'Aucune vidéo à mettre à jour' });
    }

    const videoIds = videos.map(v => v.video_id);
    const apiKey = process.env.YOUTUBE_API_KEY;

    // L'API YouTube permet de demander jusqu'à 50 IDs à la fois
    const chunkSize = 50;
    const historyEntries = [];

    for (let i = 0; i < videoIds.length; i += chunkSize) {
      const chunk = videoIds.slice(i, i + chunkSize);
      const idsParam = chunk.join(',');
      
      const ytUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${idsParam}&key=${apiKey}`;
      const ytResponse = await fetch(ytUrl);
      const ytData = await ytResponse.json();

      if (ytData.items) {
        for (const item of ytData.items) {
          historyEntries.push({
            video_id: item.id,
            views: parseInt(item.statistics.viewCount || 0, 10),
            likes: parseInt(item.statistics.likeCount || 0, 10),
            comments: parseInt(item.statistics.commentCount || 0, 10)
          });
        }
      }
    }

    // Insérer tout l'historique d'un coup pour les vidéos
    if (historyEntries.length > 0) {
      const { error: insertError } = await supabase
        .from('youtube_stats_history')
        .insert(historyEntries);
        
      if (insertError) throw insertError;
    }

    // --- MISE A JOUR DES CHAINES YOUTUBE ---
    const { data: channels, error: channelsDbError } = await supabase
      .from('youtube_channels')
      .select('channel_id');
      
    if (channelsDbError) throw channelsDbError;
    
    let updatedChannelsCount = 0;
    if (channels && channels.length > 0) {
      const channelIds = channels.map(c => c.channel_id);
      const channelHistoryEntries = [];
      
      for (let i = 0; i < channelIds.length; i += chunkSize) {
        const chunk = channelIds.slice(i, i + chunkSize);
        const idsParam = chunk.join(',');
        
        const ytUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${idsParam}&key=${apiKey}`;
        const ytResponse = await fetch(ytUrl);
        const ytData = await ytResponse.json();
        
        if (ytData.items) {
          for (const item of ytData.items) {
            channelHistoryEntries.push({
              channel_id: item.id,
              views: parseInt(item.statistics.viewCount || 0, 10),
              subscribers: parseInt(item.statistics.subscriberCount || 0, 10),
              video_count: parseInt(item.statistics.videoCount || 0, 10)
            });
          }
        }
      }
      
      if (channelHistoryEntries.length > 0) {
        const { error: insertChannelError } = await supabase
          .from('youtube_channel_stats_history')
          .insert(channelHistoryEntries);
          
        if (insertChannelError) throw insertChannelError;
        updatedChannelsCount = channelHistoryEntries.length;
      }
    }

    return NextResponse.json({ success: true, updatedVideos: historyEntries.length, updatedChannels: updatedChannelsCount });

  } catch (error) {
    console.error('Erreur CRON youtube:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur', details: error.message }, { status: 500 });
  }
}
