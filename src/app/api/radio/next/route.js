import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request) {
  try {
    const supabase = await createClient();
    
    // 1. Récupérer l'état actuel
    const { data: state, error: stateError } = await supabase
      .from('radio_state')
      .select('*, radio_tracks(duration_ms)')
      .eq('id', 1)
      .single();

    if (stateError) throw stateError;

    // Si on est en direct, on ne change pas de piste automatiquement
    if (state.mode === 'live') {
      return NextResponse.json({ success: true, state });
    }

    // Vérifier si la piste est vraiment terminée (marge de 5 secondes)
    if (state.track_started_at && state.radio_tracks?.duration_ms) {
      const startedAt = new Date(state.track_started_at).getTime();
      const now = Date.now();
      const elapsed = now - startedAt;
      
      // Si la piste n'est pas encore terminée (avec une marge de 10s pour compenser la latence client), on ignore la requête
      // pour éviter que plusieurs clients passent la piste en même temps.
      if (elapsed < state.radio_tracks.duration_ms - 10000) {
        return NextResponse.json({ success: true, message: 'La piste actuelle n\'est pas encore terminée', state });
      }
    }

    // 2. Choisir une nouvelle piste aléatoire (différente de l'actuelle si possible)
    let query = supabase.from('radio_tracks').select('id');
    if (state.current_track_id) {
      query = query.neq('id', state.current_track_id);
    }
    
    const { data: tracks, error: tracksError } = await query;
    if (tracksError || !tracks || tracks.length === 0) {
      // Si aucune piste disponible, on ne fait rien
      return NextResponse.json({ error: 'Aucune piste disponible' }, { status: 404 });
    }

    // Choix aléatoire
    const randomIndex = Math.floor(Math.random() * tracks.length);
    const nextTrackId = tracks[randomIndex].id;

    // 3. Mettre à jour l'état
    const { data: newState, error: updateError } = await supabase
      .from('radio_state')
      .update({
        current_track_id: nextTrackId,
        track_started_at: new Date().toISOString()
      })
      .eq('id', 1)
      .select()
      .single();

    if (updateError) throw updateError;

    // 4. Ajouter à l'historique
    await supabase.from('radio_history').insert({ track_id: nextTrackId });

    return NextResponse.json({ success: true, state: newState });
  } catch (error) {
    console.error('Radio Next Track Error:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
