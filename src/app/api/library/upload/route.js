import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { base64, fileName, fileType, size, source } = await request.json();
    if (!base64 || !fileName) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    // Calcul du hash md5 de l'image (du contenu base64) pour l'anti-doublon
    const hash = crypto.createHash('md5').update(base64).digest('hex');

    // Vérifier si le hash existe déjà
    const { data: existingMedia } = await supabase
      .from('media_library')
      .select('file_url')
      .eq('hash', hash)
      .maybeSingle();

    if (existingMedia) {
      return NextResponse.json({ 
        url: existingMedia.file_url,
        message: 'Image déjà présente dans la bibliothèque',
        isDuplicate: true 
      });
    }

    // Convertir le base64 en Buffer
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${fileName}`;
    const bucket = 'social_posts'; // ou 'media_library' si on crée un bucket séparé

    // Upload
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(`library/${uniqueFileName}`, buffer, {
        contentType: fileType || 'image/png',
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(`library/${uniqueFileName}`);

    const fileUrl = publicUrlData.publicUrl;

    // Sauvegarder dans la table
    const { error: dbError } = await supabase
      .from('media_library')
      .insert({
        file_name: fileName,
        file_url: fileUrl,
        file_type: source || 'generation', // 'image', 'video', 'generation'
        file_size: size || buffer.length,
        hash: hash
      });

    if (dbError) throw dbError;

    return NextResponse.json({ 
      url: fileUrl, 
      message: 'Upload réussi',
      isDuplicate: false 
    });

  } catch (error) {
    console.error('Erreur API library upload:', error);
    return NextResponse.json({ error: 'Erreur interne', details: error.message }, { status: 500 });
  }
}
