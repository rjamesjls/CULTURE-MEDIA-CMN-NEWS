import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { fetchSocialBladeStats } from '@/lib/socialblade';

// Limite pour ne pas surcharger l'API Social Blade en un seul appel
const BATCH_SIZE = 50;

export async function GET(request) {
  try {
    // Vérification du Bearer token pour sécuriser le cron (utilisé par Vercel Cron)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // 1. Récupérer les créateurs
    const { data: creators, error: fetchError } = await supabase
      .from('content_creators')
      .select('*')
      .limit(BATCH_SIZE);

    if (fetchError) throw fetchError;

    let updatedCount = 0;
    let errors = [];

    // 2. Mettre à jour chaque créateur
    for (const creator of creators) {
      try {
        const sbData = await fetchSocialBladeStats(creator.username, creator.platform);
        
        if (sbData) {
          const totalStats = sbData.total || {};
          const followers = parseInt(totalStats.subscribers || totalStats.followers || 0, 10);
          const likes = parseInt(totalStats.likes || 0, 10);
          const media_count = parseInt(totalStats.uploads || totalStats.media || 0, 10);
          let avatarUrl = sbData.raw?.id?.avatar || creator.profile_picture_url;

          // Mettre à jour la table créateur si l'avatar a changé
          if (avatarUrl && avatarUrl !== creator.profile_picture_url) {
            await supabase
              .from('content_creators')
              .update({ profile_picture_url: avatarUrl })
              .eq('id', creator.id);
          }

          // Ajouter à l'historique
          const { error: insertError } = await supabase
            .from('creator_stats_history')
            .insert({
              creator_id: creator.id,
              followers: followers,
              likes: likes,
              media_count: media_count
            });

          if (insertError) throw insertError;
          updatedCount++;
        }
      } catch (err) {
        console.error(`Erreur maj créateur ${creator.username}:`, err);
        errors.push({ username: creator.username, error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Stats créateurs mises à jour pour ${updatedCount}/${creators.length} profils.`,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Erreur CRON créateurs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
