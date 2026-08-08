import { NextResponse } from 'next/server';
import crypto from 'crypto';

function base64URLEncode(str) {
  return str.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest();
}

export async function GET(req) {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const redirectUri = process.env.TIKTOK_REDIRECT_URI || 'https://culturemedianews.fr/api/auth/tiktok/callback';

  if (!clientKey) {
    return NextResponse.json({ error: 'La variable TIKTOK_CLIENT_KEY est manquante dans .env.local' }, { status: 500 });
  }

  // 1. Generate state
  const state = Math.random().toString(36).substring(7);
  
  // 2. Generate PKCE code_verifier and code_challenge
  const codeVerifier = base64URLEncode(crypto.randomBytes(32));
  const codeChallenge = base64URLEncode(sha256(codeVerifier));
  
  // Scopes requis pour publier une vidéo sur TikTok via l'API v2
  const scopes = 'user.info.basic,video.upload,video.publish';

  const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=${scopes}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

  const response = NextResponse.redirect(authUrl);
  
  // Save code_verifier in a cookie to be used in the callback
  response.cookies.set('tiktok_code_verifier', codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });

  return response;
}
