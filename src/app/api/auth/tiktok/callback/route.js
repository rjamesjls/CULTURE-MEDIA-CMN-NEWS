import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  if (error) {
    console.error('TikTok Auth Error:', error, errorDescription);
    return NextResponse.redirect(new URL('/admin/reels-studio?error=auth_denied', req.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/admin/reels-studio?error=no_code', req.url));
  }

  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  const redirectUri = process.env.TIKTOK_REDIRECT_URI || 'https://culturemedianews.fr/api/auth/tiktok/callback';

  try {
    const cookieStore = await cookies();
    const codeVerifier = cookieStore.get('tiktok_code_verifier')?.value;

    const tokenParams = new URLSearchParams();
    tokenParams.append('client_key', clientKey);
    tokenParams.append('client_secret', clientSecret);
    tokenParams.append('code', code);
    tokenParams.append('grant_type', 'authorization_code');
    tokenParams.append('redirect_uri', redirectUri);
    if (codeVerifier) {
      tokenParams.append('code_verifier', codeVerifier);
    }

    const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache',
      },
      body: tokenParams,
    });

    const data = await res.json();

    if (data.error) {
      console.error('TikTok token API error:', data);
      return NextResponse.redirect(new URL('/admin/reels-studio?error=token_failed', req.url));
    }

    const response = NextResponse.redirect(new URL('/admin/reels-studio?success=tiktok_connected', req.url));
    
    // Set cookies to store the access token and open_id safely
    if (data.access_token) {
      response.cookies.set('tiktok_access_token', data.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: data.expires_in || 86400,
        path: '/',
      });
    }
    
    if (data.open_id) {
      response.cookies.set('tiktok_open_id', data.open_id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: data.expires_in || 86400,
        path: '/',
      });
    }

    return response;
  } catch (err) {
    console.error('Callback network error:', err);
    return NextResponse.redirect(new URL('/admin/reels-studio?error=server_error', req.url));
  }
}
