import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, title, pagesData } = await request.json();
    if (!pagesData || !title) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    if (id) {
      // Mise à jour d'une session existante
      const { error: dbError } = await supabase
        .from('saved_carousels')
        .update({
          title,
          pages_data: pagesData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (dbError) throw dbError;
      return NextResponse.json({ message: 'Session mise à jour avec succès', id });
    } else {
      // Création d'une nouvelle session
      const { data, error: dbError } = await supabase
        .from('saved_carousels')
        .insert({
          title,
          pages_data: pagesData,
          user_id: user.id
        })
        .select()
        .single();

      if (dbError) throw dbError;
      return NextResponse.json({ message: 'Session sauvegardée avec succès', id: data.id });
    }
  } catch (error) {
    console.error('Erreur API save-session:', error);
    return NextResponse.json({ error: 'Erreur interne', details: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('saved_carousels')
      .select('id, title, updated_at, pages_data')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    
    return NextResponse.json({ sessions: data });
  } catch (error) {
    console.error('Erreur API save-session GET:', error);
    return NextResponse.json({ error: 'Erreur interne', details: error.message }, { status: 500 });
  }
}
