import { NextResponse } from 'next/server';

export async function GET(req) {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const redirectUri = process.env.TIKTOK_REDIRECT_URI || 'https://culturemedianews.fr/api/auth/tiktok/callback';

  if (!clientKey) {
    return NextResponse.json({ error: 'La variable TIKTOK_CLIENT_KEY est manquante dans .env.local' }, { status: 500 });
  }

  // CSRF state
  const state = Math.random().toString(36).substring(7);
  
  // Scopes requis pour publier une vidéo sur TikTok via l'API v2
  const scopes = 'user.info.basic,video.upload,video.publish';

  const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=${scopes}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

  return NextResponse.redirect(authUrl);
}
