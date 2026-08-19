import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { action, type, id, sector } = body;

    if (!action || !type || !id) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    const tableName = type === 'clips' ? 'youtube_videos' : 'youtube_channels';

    if (action === 'delete') {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Élément supprimé avec succès' });
    } 
    
    if (action === 'update_sector') {
      if (!sector) {
        return NextResponse.json({ error: 'Secteur manquant pour la mise à jour' }, { status: 400 });
      }

      const { error } = await supabase
        .from(tableName)
        .update({ sector })
        .eq('id', id);

      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Secteur mis à jour avec succès' });
    }

    return NextResponse.json({ error: 'Action invalide' }, { status: 400 });

  } catch (error) {
    console.error('Erreur youtube manage:', error);
    return NextResponse.json({ error: 'Erreur interne', details: error.message }, { status: 500 });
  }
}
