import { NextResponse } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

const locales = ['fr', 'bsh'];
const defaultLocale = 'fr';

export async function middleware(request) {
  try {
    const supabaseResponse = await updateSession(request);
    const { pathname } = request.nextUrl;

    // Ignore /api, /admin, /auth and files
    if (
      pathname.startsWith('/api') ||
      pathname.startsWith('/admin') ||
      pathname.startsWith('/auth') ||
      pathname.startsWith('/_next') ||
      pathname.startsWith('/js') ||
      pathname.startsWith('/images') ||
      pathname.startsWith('/backgrounds') ||
      pathname.includes('.')
    ) {
      return supabaseResponse;
    }

    // Find if URL has locale
    const pathnameHasLocale = locales.some(
      (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );

    let langToSet = defaultLocale;
    let finalResponse = supabaseResponse;

    if (!pathnameHasLocale) {
      // Redirect to default locale
      request.nextUrl.pathname = `/${defaultLocale}${pathname}`;
      finalResponse = NextResponse.redirect(request.nextUrl);
      langToSet = defaultLocale;
    } else {
      // Extract locale from pathname
      langToSet = pathname.split('/')[1];
      finalResponse = NextResponse.next({
        request: {
          headers: request.headers,
        }
      });
    }

    // Copy cookies from supabase updateSession
    supabaseResponse.cookies.getAll().forEach(cookie => {
      finalResponse.cookies.set(cookie.name, cookie.value, {
        domain: cookie.domain,
        path: cookie.path,
        expires: cookie.expires,
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
        sameSite: cookie.sameSite
      });
    });

    // Set the language in a custom header so root layout can read it
    finalResponse.headers.set('x-lang', langToSet);
    
    return finalResponse;
  } catch (error) {
    return new Response(`Middleware Error: ${error.message}\n${error.stack}`, {
      status: 200,
      headers: { 'content-type': 'text/plain' }
    });
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
