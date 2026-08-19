import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Récupérer le paramètre de filtre
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'image', 'video', 'generation', etc.

    let query = supabase
      .from('media_library')
      .select('*')
      .order('created_at', { ascending: false });

    if (type && type !== 'all') {
      query = query.eq('file_type', type);
    }

    const { data, error } = await query;

    if (error) {
      // Si la table n'existe pas encore
      if (error.code === '42P01') {
        return NextResponse.json({ items: [] });
      }
      throw error;
    }

    return NextResponse.json({ items: data });

  } catch (error) {
    console.error('Erreur API library list:', error);
    return NextResponse.json({ error: 'Erreur interne', details: error.message }, { status: 500 });
  }
}
