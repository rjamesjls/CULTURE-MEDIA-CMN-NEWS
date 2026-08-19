import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * POST /api/youtube/channels/refresh-thumbnails
 * Fetches fresh profile picture URLs from YouTube API for all tracked channels
 * and updates the database.
 */
export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const apiKey = process.env.YOUTUBE_API_KEY;

    // 1. Get all channels from DB
    const { data: channels, error: dbError } = await supabase
      .from('youtube_channels')
      .select('id, channel_id, title');

    if (dbError) throw dbError;
    if (!channels || channels.length === 0) {
      return NextResponse.json({ success: true, updated: 0 });
    }

    let updated = 0;
    const errors = [];

    // 2. Process in batches of 50 (YouTube API limit)
    for (let i = 0; i < channels.length; i += 50) {
      const batch = channels.slice(i, i + 50);
      const ids = batch.map(c => c.channel_id).join(',');

      try {
        const ytUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${ids}&key=${apiKey}`;
        const ytRes = await fetch(ytUrl);
        const ytData = await ytRes.json();

        if (!ytData.items) continue;

        for (const item of ytData.items) {
          const thumbnails = item.snippet?.thumbnails;
          // Prefer high res, then medium, then default
          const freshUrl = thumbnails?.high?.url || thumbnails?.medium?.url || thumbnails?.default?.url;
          
          if (!freshUrl) continue;

          const { error: updateError } = await supabase
            .from('youtube_channels')
            .update({ thumbnail_url: freshUrl })
            .eq('channel_id', item.id);

          if (!updateError) updated++;
          else errors.push(`${item.id}: ${updateError.message}`);
        }
      } catch (batchErr) {
        errors.push(`Batch error: ${batchErr.message}`);
      }
    }

    return NextResponse.json({ success: true, updated, errors });

  } catch (error) {
    console.error('Erreur refresh thumbnails:', error);
    return NextResponse.json({ error: 'Erreur interne', details: error.message }, { status: 500 });
  }
}
