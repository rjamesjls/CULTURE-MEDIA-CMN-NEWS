import { NextResponse } from 'next/server';

// ──────────────────────────────────────────────
// API Route : POST /api/reels/publish
// Publie la vidéo sur Instagram (Meta) ou TikTok
// ──────────────────────────────────────────────

async function publishToInstagram(videoBlob, caption) {
  const accessToken = process.env.META_ACCESS_TOKEN;
  const igUserId = process.env.META_IG_USER_ID;

  if (!accessToken || !igUserId) {
    throw new Error('META_ACCESS_TOKEN ou META_IG_USER_ID manquant dans .env.local');
  }

  // Étape 1 : Créer le container vidéo
  const initRes = await fetch(
    `https://graph.facebook.com/v19.0/${igUserId}/media`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media_type: 'REELS',
        video_url: '', // À remplacer par une URL publique
        caption,
        access_token: accessToken,
      }),
    }
  );
  const initData = await initRes.json();
  if (initData.error) throw new Error(`Instagram: ${initData.error.message}`);

  const creationId = initData.id;

  // Étape 2 : Attendre que la vidéo soit prête (polling)
  let status = 'IN_PROGRESS';
  let attempts = 0;
  while (status !== 'FINISHED' && attempts < 20) {
    await new Promise(r => setTimeout(r, 3000));
    const statusRes = await fetch(
      `https://graph.facebook.com/v19.0/${creationId}?fields=status_code&access_token=${accessToken}`
    );
    const statusData = await statusRes.json();
    status = statusData.status_code || 'IN_PROGRESS';
    attempts++;
  }

  if (status !== 'FINISHED') {
    throw new Error('La vidéo Instagram n\'a pas été traitée à temps.');
  }

  // Étape 3 : Publier
  const pubRes = await fetch(
    `https://graph.facebook.com/v19.0/${igUserId}/media_publish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: creationId,
        access_token: accessToken,
      }),
    }
  );
  const pubData = await pubRes.json();
  if (pubData.error) throw new Error(`Instagram publish: ${pubData.error.message}`);

  return { id: pubData.id };
}

async function publishToTikTok(videoBlob, caption, cookieAccessToken) {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  const accessToken = process.env.TIKTOK_ACCESS_TOKEN || cookieAccessToken; // Token obtenu via OAuth

  if (!clientKey || !clientSecret) {
    throw new Error(
      'TIKTOK_CLIENT_KEY ou TIKTOK_CLIENT_SECRET manquant dans .env.local. ' +
      'Créez une app sur developers.tiktok.com et ajoutez les variables.'
    );
  }

  if (!accessToken) {
    throw new Error(
      'TIKTOK_ACCESS_TOKEN manquant. Vous devez d\'abord autoriser l\'accès TikTok ' +
      'via OAuth (/api/auth/tiktok).'
    );
  }

  // Initialiser l'upload (Direct Post)
  const initRes = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify({
      post_info: {
        title: caption.substring(0, 150),
        privacy_level: 'SELF_ONLY', // Changer en PUBLIC_TO_EVERYONE pour publier publiquement
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
        video_cover_timestamp_ms: 1000,
      },
      source_info: {
        source: 'FILE_UPLOAD',
        video_size: videoBlob.size,
        chunk_size: videoBlob.size,
        total_chunk_count: 1,
      },
    }),
  });
  const initData = await initRes.json();
  if (initData.error?.code && initData.error.code !== 'ok') {
    throw new Error(`TikTok init: ${initData.error.message}`);
  }

  const { publish_id, upload_url } = initData.data;

  // Upload de la vidéo
  const uploadRes = await fetch(upload_url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'video/webm',
      'Content-Range': `bytes 0-${videoBlob.size - 1}/${videoBlob.size}`,
      'Content-Length': String(videoBlob.size),
    },
    body: videoBlob,
  });

  if (!uploadRes.ok) {
    throw new Error(`TikTok upload échoué: HTTP ${uploadRes.status}`);
  }

  return { publish_id };
}

import { cookies } from 'next/headers';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const platform = formData.get('platform');
    const caption = formData.get('caption') || '';
    const videoFile = formData.get('video');

    if (!videoFile) {
      return NextResponse.json({ error: 'Aucun fichier vidéo fourni' }, { status: 400 });
    }

    const videoBlob = new Blob([await videoFile.arrayBuffer()], { type: 'video/webm' });

    let result;
    if (platform === 'instagram') {
      result = await publishToInstagram(videoBlob, caption);
    } else if (platform === 'tiktok') {
      const cookieStore = cookies();
      const tiktokAccessToken = cookieStore.get('tiktok_access_token')?.value;
      result = await publishToTikTok(videoBlob, caption, tiktokAccessToken);
    } else {
      return NextResponse.json({ error: `Plateforme inconnue: ${platform}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('/api/reels/publish error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
