import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { fetchSocialBladeStats } from '@/lib/socialblade';

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { input, platform, country } = await request.json();

    if (!input || !platform || !country) {
      return NextResponse.json({ error: 'Username, platforme et pays requis' }, { status: 400 });
    }

    let username = input.trim();
    if (username.startsWith('@')) {
      username = username.substring(1);
    }
    
    // Extract from URL if necessary
    const urlMatch = username.match(/(?:tiktok\.com\/@|instagram\.com\/)([^\/\?]+)/);
    if (urlMatch) {
      username = urlMatch[1];
    }

    // Call SocialBlade API to verify existence and get initial stats
    const sbData = await fetchSocialBladeStats(username, platform);
    
    if (sbData && sbData.error) {
      return NextResponse.json({ error: sbData.message }, { status: 400 });
    }

    if (!sbData) {
      return NextResponse.json({ 
        error: 'Le compte n\'a pas été trouvé sur SocialBlade, ou l\'API a bloqué la requête. Vérifiez le pseudo.' 
      }, { status: 400 });
    }

    const totalStats = sbData.total || {};
    const followers = parseInt(totalStats.subscribers || totalStats.followers || 0, 10);
    const likes = parseInt(totalStats.likes || 0, 10); // TikTok specific
    const media_count = parseInt(totalStats.uploads || totalStats.media || 0, 10);
    
    // SocialBlade doesn't always return avatar in standard v2 easily, but let's try
    let avatarUrl = sbData.raw?.id?.avatar || '';

    // 1. Sauvegarder dans content_creators
    const { data: creatorData, error: dbError } = await supabase
      .from('content_creators')
      .upsert({
        platform: platform,
        username: sbData.username || username,
        country: country,
        profile_picture_url: avatarUrl
      }, { onConflict: 'platform, username' })
      .select()
      .single();

    if (dbError) throw dbError;

    // 2. Ajouter la première entrée dans l'historique
    const { error: historyError } = await supabase
      .from('creator_stats_history')
      .insert({
        creator_id: creatorData.id,
        followers: followers,
        likes: likes,
        media_count: media_count
      });

    if (historyError) throw historyError;

    return NextResponse.json({ success: true, creator: creatorData });

  } catch (error) {
    console.error('Erreur ajout créateur:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur', details: error.message }, { status: 500 });
  }
}
