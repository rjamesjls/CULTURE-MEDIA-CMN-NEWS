import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const revalidate = 0; // Disable cache for this route

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Récupérer l'état actuel et les infos de la piste
    const { data: state, error } = await supabase
      .from('radio_state')
      .select(`
        *,
        radio_tracks (
          id, title, artist, audio_url, cover_url, duration_ms
        )
      `)
      .eq('id', 1)
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, state });
  } catch (error) {
    console.error('Radio State Error:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
